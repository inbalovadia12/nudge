import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PLAID_ENV = Deno.env.get("PLAID_ENV") || "production";
const PLAID_URL = `https://${PLAID_ENV}.plaid.com`;
const CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
const SECRET = Deno.env.get("PLAID_SECRET");

async function plaidRequest(endpoint, body) {
  const res = await fetch(`${PLAID_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, secret: SECRET, ...body }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error_message || `Plaid API error: ${res.status}`);
    err.plaid_error_code = data.error_code;
    err.plaid_error_type = data.error_type;
    throw err;
  }
  return data;
}

function isTokenError(err) {
  return err.plaid_error_code === 'ITEM_LOGIN_REQUIRED' ||
    err.plaid_error_code === 'ITEM_REVOKED' ||
    err.plaid_error_code === 'ITEM_EXPIRED';
}

// Hash for deduplication when syncing into UnifiedTransaction
function makeUnifiedHash(date, merchant, amount, currency) {
  const key = [date, (merchant || '').toLowerCase().trim(), String(amount), (currency || '').toUpperCase().trim()].join('|');
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// Simple recurring detection: group by normalized merchant name, find regular intervals
function detectRecurring(transactions) {
  const groups = {};
  for (const t of transactions) {
    const key = (t.merchant_name || t.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  const recurring = [];
  for (const [key, txns] of Object.entries(groups)) {
    if (txns.length < 2) continue;
    const amounts = txns.map(t => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    // Check if amounts are similar (within 10%)
    const allSimilar = amounts.every(a => Math.abs(a - avg) / Math.abs(avg) < 0.15);
    if (!allSimilar) continue;

    // Check date intervals
    const dates = txns.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    // Roughly weekly (5-9), biweekly (12-18), monthly (25-35)
    const isRegular = (avgInterval >= 5 && avgInterval <= 40) && intervals.every(i => Math.abs(i - avgInterval) / avgInterval < 0.3);
    if (!isRegular) continue;

    let recurringType = 'bill';
    if (avg < 0) {
      // Income is positive in Plaid (money in), but let me check... actually in Plaid, positive = money out, negative = money in
      // Wait no: in Plaid, positive amounts = money spent (outflow), negative amounts = money received (inflow)
      // Actually it's the opposite: in Plaid, positive = outflow (debit), negative = inflow (credit)
      // Hmm, let me think... Plaid docs: "amount": The value of the transaction. Positive = money spent, negative = money received
      // So income would be negative amounts
    }
    // avg > 0 means money spent (subscriptions/bills), avg < 0 means money received (income)
    if (avg < 0) recurringType = 'income';
    else if (avgInterval >= 25 && avgInterval <= 35) recurringType = 'subscription';
    else if (avgInterval >= 5 && avgInterval <= 9) recurringType = 'bill';

    recurring.push({
      merchant: txns[0].merchant_name || txns[0].name,
      amount: avg,
      interval_days: Math.round(avgInterval),
      type: recurringType,
      last_date: txns[0].date,
      transaction_count: txns.length,
    });
  }
  return recurring;
}

// ─── Plaid sync limits & caching ───
const MAX_FULL_SYNCS_PER_DAY = 1;
const MAX_MANUAL_REFRESHES_PER_DAY = 3;
const SYNC_CACHE_HOURS = 6;

function isSameDay(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return false;
  return dateStr1.split('T')[0] === dateStr2.split('T')[0];
}

async function countSyncsToday(base44, userId, syncType) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const records = await base44.asServiceRole.entities.CreditTransaction.filter(
    { feature_name: syncType, created_by_id: userId },
    '-created_date', 50
  ).catch(() => []);
  return records.filter(r => new Date(r.created_date) >= todayStart).length;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const { action, public_token, start_date, end_date, force_refresh } = payload;

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by_id: user.id });
    const profile = profiles[0];

    // Enforce premium-only (Pro tier) access for Plaid bank sync
    const isPremium = profile && (
      profile.is_premium ||
      profile.plan_type === 'pro' ||
      (profile.subscription_status === 'active' && profile.subscription_plan === 'pro') ||
      (profile.premium_trial_end_date && new Date(profile.premium_trial_end_date) > new Date())
    );
    if (!isPremium) {
      return Response.json({ error: 'Bank sync is a Premium feature. Upgrade to Pro to connect your bank.', needs_upgrade: true }, { status: 403 });
    }

    if (action === 'test') {
      try {
        const res = await plaidRequest('/link/token/create', {
          user: { client_user_id: 'test_user' },
          client_name: 'Vesper',
          products: ['transactions'],
          country_codes: ['US'],
          language: 'en',
        });
        return Response.json({
          success: true,
          environment: PLAID_ENV,
          linkTokenReceived: !!res.link_token,
          message: 'Plaid credentials are valid and working.'
        });
      } catch (error) {
        console.error('Plaid test error:', error.message);
        return Response.json({ success: false, error: error.message, environment: PLAID_ENV }, { status: 500 });
      }
    }

    if (action === 'create_link_token') {
      const res = await plaidRequest('/link/token/create', {
        user: { client_user_id: user.id },
        client_name: 'Vesper',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      });
      return Response.json({ link_token: res.link_token, env: PLAID_ENV });
    }

    if (action === 'exchange_public_token') {
      if (!public_token) return Response.json({ error: 'public_token is required' }, { status: 400 });
      const res = await plaidRequest('/item/public_token/exchange', { public_token });

      // Get institution name
      let institutionName = 'Unknown Bank';
      try {
        const itemRes = await plaidRequest('/item/get', {
          access_token: res.access_token,
        });
        if (itemRes.item?.institution_id) {
          const instRes = await plaidRequest('/institutions/get_by_id', {
            institution_id: itemRes.item.institution_id,
            country_codes: ['US'],
          });
          if (instRes.institution) institutionName = instRes.institution.name;
        }
      } catch {}

      if (profile) {
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          plaid_access_token: res.access_token,
          plaid_item_id: res.item_id,
          plaid_institution_name: institutionName,
          plaid_last_sync_date: new Date().toISOString(),
          connected_bank: true,
        });
      }
      return Response.json({ success: true, item_id: res.item_id, institution_name: institutionName });
    }

    if (action === 'get_accounts') {
      if (!profile?.plaid_access_token) {
        return Response.json({ error: 'No bank account connected' }, { status: 400 });
      }
      let res;
      try {
        res = await plaidRequest('/accounts/balance/get', {
          access_token: profile.plaid_access_token,
        });
      } catch (err) {
        if (isTokenError(err)) {
          return Response.json({ error: 'Your bank connection has expired. Please reconnect.', needs_reconnect: true }, { status: 401 });
        }
        throw err;
      }

      const now = new Date().toISOString();
      const accounts = res.accounts.map(a => ({
        account_id: a.account_id,
        name: a.name,
        official_name: a.official_name,
        type: a.type,
        subtype: a.subtype,
        mask: a.mask,
        current_balance: a.balances?.current,
        available_balance: a.balances?.available,
        currency: a.balances?.iso_currency_code,
        institution_name: profile.plaid_institution_name || 'Unknown Bank',
        last_synced: now,
      }));

      // Sync to BankAccount entity
      const existing = await base44.asServiceRole.entities.BankAccount.filter({});
      const existingMap = new Map(existing.map(e => [e.account_id, e]));
      for (const acc of accounts) {
        if (existingMap.has(acc.account_id)) {
          await base44.asServiceRole.entities.BankAccount.update(existingMap.get(acc.account_id).id, acc);
        } else {
          await base44.asServiceRole.entities.BankAccount.create(acc);
        }
      }

      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        plaid_last_sync_date: now,
      });

      return Response.json({ accounts, institution_name: profile.plaid_institution_name });
    }

    if (action === 'get_transactions') {
      if (!profile?.plaid_access_token) {
        return Response.json({ error: 'No bank account connected' }, { status: 400 });
      }
      const end = end_date || new Date().toISOString().split('T')[0];
      const start = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let res;
      try {
        res = await plaidRequest('/transactions/get', {
          access_token: profile.plaid_access_token,
          start_date: start,
          end_date: end,
          options: { count: 100, offset: 0 },
        });
      } catch (err) {
        if (isTokenError(err)) {
          return Response.json({ error: 'Your bank connection has expired. Please reconnect.', needs_reconnect: true }, { status: 401 });
        }
        throw err;
      }

      const transactions = res.transactions.map(t => ({
        transaction_id: t.transaction_id,
        name: t.name,
        merchant_name: t.merchant_name,
        amount: t.amount,
        date: t.date,
        category: t.category ? t.category[0] : null,
        account_id: t.account_id,
        is_recurring: false,
      }));

      return Response.json({ transactions, total_count: res.total_transactions });
    }

    if (action === 'sync_data') {
      if (!profile?.plaid_access_token) {
        return Response.json({ error: 'No bank account connected' }, { status: 400 });
      }

      // Fetch accounts
      let accountsRes;
      try {
        accountsRes = await plaidRequest('/accounts/balance/get', {
          access_token: profile.plaid_access_token,
        });
      } catch (err) {
        if (isTokenError(err)) {
          return Response.json({ error: 'Your bank connection has expired. Please reconnect.', needs_reconnect: true }, { status: 401 });
        }
        throw err;
      }

      // Fetch transactions (last 90 days for recurring detection)
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      let txnsRes;
      try {
        txnsRes = await plaidRequest('/transactions/get', {
          access_token: profile.plaid_access_token,
          start_date: start,
          end_date: end,
          options: { count: 250, offset: 0 },
        });
      } catch (err) {
        if (isTokenError(err)) {
          return Response.json({ error: 'Your bank connection has expired. Please reconnect.', needs_reconnect: true }, { status: 401 });
        }
        throw err;
      }

      const syncNow = new Date().toISOString();

      // Sync accounts
      const accounts = accountsRes.accounts.map(a => ({
        account_id: a.account_id,
        name: a.name,
        official_name: a.official_name,
        type: a.type,
        subtype: a.subtype,
        mask: a.mask,
        current_balance: a.balances?.current,
        available_balance: a.balances?.available,
        currency: a.balances?.iso_currency_code,
        institution_name: profile.plaid_institution_name || 'Unknown Bank',
        last_synced: syncNow,
      }));

      const existingAccounts = await base44.asServiceRole.entities.BankAccount.filter({});
      const accountMap = new Map(existingAccounts.map(e => [e.account_id, e]));
      for (const acc of accounts) {
        if (accountMap.has(acc.account_id)) {
          await base44.asServiceRole.entities.BankAccount.update(accountMap.get(acc.account_id).id, acc);
        } else {
          await base44.asServiceRole.entities.BankAccount.create(acc);
        }
      }

      // Detect recurring transactions
      const recurring = detectRecurring(txnsRes.transactions);
      const recurringTxnIds = new Set();
      const recurringMerchantSet = new Set(recurring.map(r => r.merchant?.toLowerCase()));
      for (const r of recurring) {
        for (const t of txnsRes.transactions) {
          const tName = (t.merchant_name || t.name || '').toLowerCase();
          if (tName === r.merchant?.toLowerCase()) recurringTxnIds.add(t.transaction_id);
        }
      }

      // Sync transactions
      const transactions = txnsRes.transactions.map(t => {
        const isRec = recurringTxnIds.has(t.transaction_id);
        const recMatch = recurring.find(r => {
          const tName = (t.merchant_name || t.name || '').toLowerCase();
          return tName === r.merchant?.toLowerCase();
        });
        return {
          transaction_id: t.transaction_id,
          name: t.name,
          merchant_name: t.merchant_name,
          amount: t.amount,
          date: t.date,
          category: t.category ? t.category[0] : null,
          account_id: t.account_id,
          is_recurring: isRec,
          recurring_type: isRec ? recMatch?.type : null,
        };
      });

      // Bulk upsert transactions
      const existingTxns = await base44.asServiceRole.entities.BankTransaction.filter({});
      const txnMap = new Map(existingTxns.map(e => [e.transaction_id, e]));
      const toCreate = [];
      const toUpdate = [];
      for (const txn of transactions) {
        if (txnMap.has(txn.transaction_id)) {
          toUpdate.push({ id: txnMap.get(txn.transaction_id).id, ...txn });
        } else {
          toCreate.push(txn);
        }
      }
      if (toCreate.length > 0) await base44.asServiceRole.entities.BankTransaction.bulkCreate(toCreate);
      if (toUpdate.length > 0) await base44.asServiceRole.entities.BankTransaction.bulkUpdate(toUpdate);

      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        plaid_last_sync_date: syncNow,
      });

      // Sync into UnifiedTransaction (unified model)
      const unifiedExisting = await base44.asServiceRole.entities.UnifiedTransaction.filter({ source: 'plaid' });
      const unifiedMap = new Map(unifiedExisting.map(e => [e.source_hash, e]));
      const unifiedToCreate = [];
      for (const t of txnsRes.transactions) {
        const merchant = t.merchant_name || t.name || 'Unknown';
        const hash = makeUnifiedHash(t.date, merchant, t.amount, 'USD');
        if (unifiedMap.has(hash)) continue;
        unifiedMap.set(hash, true);
        const isRec = recurringTxnIds.has(t.transaction_id);
        unifiedToCreate.push({
          date: t.date,
          description: t.name,
          normalized_merchant: merchant,
          amount: t.amount,
          currency: 'USD',
          category: t.category ? t.category[0] : 'other',
          source: 'plaid',
          source_hash: hash,
          is_income: t.amount < 0,
          account_id: t.account_id,
          is_recurring: isRec,
          recurring_type: isRec ? (recurring.find(r => (r.merchant || '').toLowerCase() === merchant.toLowerCase())?.type) : null,
        });
      }
      if (unifiedToCreate.length > 0) {
        await base44.asServiceRole.entities.UnifiedTransaction.bulkCreate(unifiedToCreate);
      }

      // Income estimation
      const incomeRecurring = recurring.filter(r => r.type === 'income');
      const nextPaycheck = incomeRecurring.length > 0
        ? new Date(Date.now() + incomeRecurring[0].interval_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      return Response.json({
        success: true,
        synced_at: syncNow,
        accounts_synced: accounts.length,
        transactions_synced: transactions.length,
        recurring_detected: recurring.length,
        recurring,
        next_estimated_paycheck: nextPaycheck,
      });
    }

    if (action === 'get_recurring') {
      if (!profile?.plaid_access_token) {
        return Response.json({ error: 'No bank account connected' }, { status: 400 });
      }
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let res;
      try {
        res = await plaidRequest('/transactions/get', {
          access_token: profile.plaid_access_token,
          start_date: start,
          end_date: end,
          options: { count: 250, offset: 0 },
        });
      } catch (err) {
        if (isTokenError(err)) {
          return Response.json({ error: 'Your bank connection has expired. Please reconnect.', needs_reconnect: true }, { status: 401 });
        }
        throw err;
      }

      const recurring = detectRecurring(res.transactions);
      const income = recurring.filter(r => r.type === 'income');
      const nextPaycheck = income.length > 0
        ? new Date(Date.now() + income[0].interval_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      return Response.json({ recurring, next_estimated_paycheck: nextPaycheck });
    }

    if (action === 'disconnect') {
      if (profile?.plaid_access_token) {
        try {
          await plaidRequest('/item/remove', {
            access_token: profile.plaid_access_token,
          });
        } catch {}

        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          plaid_access_token: null,
          plaid_item_id: null,
          plaid_institution_name: null,
          plaid_last_sync_date: null,
          connected_bank: false,
        });

        // Clean up synced data
        await base44.asServiceRole.entities.BankAccount.deleteMany({});
        await base44.asServiceRole.entities.BankTransaction.deleteMany({});
      }
      return Response.json({ success: true });
    }

    if (action === 'get_status') {
      const connected = !!profile?.plaid_access_token;
      let accountCount = 0;
      let transactionCount = 0;
      if (connected) {
        accountCount = (await base44.asServiceRole.entities.BankAccount.filter({})).length;
        transactionCount = (await base44.asServiceRole.entities.BankTransaction.filter({})).length;
      }
      return Response.json({
        connected,
        env: PLAID_ENV,
        institution_name: profile?.plaid_institution_name || null,
        last_sync: profile?.plaid_last_sync_date || null,
        account_count: accountCount,
        transaction_count: transactionCount,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});