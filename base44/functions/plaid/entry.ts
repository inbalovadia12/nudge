import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ═══════════════════════════════════════════════════════════════
// PRODUCTION PLAID INTEGRATION
// All Plaid API communication, token storage, encryption, and sync
// logic lives on the backend. The frontend NEVER receives or stores
// access tokens — only link tokens and public tokens (short-lived).
// ═══════════════════════════════════════════════════════════════

// ─── Environment Configuration ───
const PLAID_ENV = Deno.env.get("PLAID_ENV") || "sandbox";
const PLAID_URL = `https://${PLAID_ENV}.plaid.com`;
const CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
const SECRET = Deno.env.get("PLAID_SECRET");

// ─── Sync Rate Limits ───
const MAX_FULL_SYNCS_PER_DAY = 1;
const MAX_MANUAL_REFRESHES_PER_DAY = 3;

// ═══════════════════════════════════════════════════════════════
// AES-256-GCM TOKEN ENCRYPTION
// Access tokens are encrypted at rest using AES-256-GCM with a key
// derived from PLAID_SECRET via PBKDF2 (100k iterations, SHA-256).
// Tokens are never stored in plaintext.
// ═══════════════════════════════════════════════════════════════

const enc = new TextEncoder();
const dec = new TextDecoder();

async function getEncryptionKey() {
  if (!SECRET) throw new Error('PLAID_SECRET not configured');
  const salt = enc.encode('nudigo-plaid-token-encryption-v1');
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(SECRET), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptToken(plaintext: string): Promise<{ encrypted: string; iv: string }> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(plaintext)
  );
  const ctBytes = new Uint8Array(ciphertext);
  return {
    encrypted: btoa(String.fromCharCode(...ctBytes)),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

async function decryptToken(encryptedB64: string, ivB64: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, ciphertext
  );
  return dec.decode(plaintext);
}

// ═══════════════════════════════════════════════════════════════
// PLAID API CALLS (with retry & error classification)
// ═══════════════════════════════════════════════════════════════

async function plaidRequest(endpoint: string, body: Record<string, any>) {
  const res = await fetch(`${PLAID_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, secret: SECRET, ...body }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error_message || `Plaid API error: ${res.status}`);
    (err as any).plaid_error_code = data.error_code;
    (err as any).plaid_error_type = data.error_type;
    throw err;
  }
  return data;
}

// Retry with exponential backoff for rate limits and transient errors
async function plaidRequestWithRetry(endpoint: string, body: Record<string, any>, maxRetries = 3) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await plaidRequest(endpoint, body);
    } catch (err: any) {
      lastErr = err;
      if (err.plaid_error_code === 'RATE_LIMIT_EXCEEDED' && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// ─── Error Classification ───
function isTokenError(err: any): boolean {
  return ['ITEM_LOGIN_REQUIRED', 'ITEM_REVOKED', 'ITEM_EXPIRED', 'ITEM_LOCKED'].includes(err.plaid_error_code);
}

// Map Plaid errors to safe user-facing messages (never expose raw errors)
function mapPlaidError(err: any) {
  const code = err.plaid_error_code;
  if (code === 'ITEM_LOGIN_REQUIRED') {
    return { safeMessage: 'Your bank connection needs to be refreshed. Please reconnect.', needsReconnect: true, itemStatus: 'relink_needed' as const };
  }
  if (code === 'ITEM_REVOKED' || code === 'ITEM_EXPIRED') {
    return { safeMessage: 'Your bank connection is no longer active. Please reconnect.', needsReconnect: true, itemStatus: 'error' as const };
  }
  if (code === 'ITEM_LOCKED') {
    return { safeMessage: 'Your bank account is locked. Please contact your bank.', needsReconnect: true, itemStatus: 'error' as const };
  }
  if (code === 'ITEM_ERROR') {
    return { safeMessage: 'There is an issue with your bank connection. Please reconnect.', needsReconnect: true, itemStatus: 'degraded' as const };
  }
  if (code === 'RATE_LIMIT_EXCEEDED') {
    return { safeMessage: 'Service is busy. Please try again in a moment.', retryable: true };
  }
  if (code === 'INSTITUTION_DOWN') {
    return { safeMessage: 'Your bank is temporarily unavailable. Please try again later.', retryable: true };
  }
  if (code === 'INVALID_INPUT') {
    console.error('Plaid INVALID_INPUT error:', err.message);
    return { safeMessage: 'Something went wrong. Please try again.' };
  }
  console.error('Unmapped Plaid error:', code, err.message);
  return { safeMessage: 'An unexpected error occurred. Please try again.' };
}

// ═══════════════════════════════════════════════════════════════
// DEDUPLICATION & RECURRING DETECTION
// ═══════════════════════════════════════════════════════════════

function makeUnifiedHash(date: string, merchant: string, amount: number, currency: string): string {
  const key = [date, (merchant || '').toLowerCase().trim(), String(amount), (currency || '').toUpperCase().trim()].join('|');
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function detectRecurring(transactions: any[]) {
  const groups: Record<string, any[]> = {};
  for (const t of transactions) {
    const key = (t.merchant_name || t.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  const recurring: any[] = [];
  for (const [key, txns] of Object.entries(groups)) {
    if (txns.length < 2) continue;
    const amounts = txns.map((t: any) => t.amount);
    const avg = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
    const allSimilar = amounts.every((a: number) => Math.abs(a - avg) / Math.abs(avg) < 0.15);
    if (!allSimilar) continue;

    const dates = txns.map((t: any) => new Date(t.date).getTime()).sort((a: number, b: number) => a - b);
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    const avgInterval = intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length;
    const isRegular = (avgInterval >= 5 && avgInterval <= 40) && intervals.every(i => Math.abs(i - avgInterval) / avgInterval < 0.3);
    if (!isRegular) continue;

    let recurringType = 'bill';
    if (avg < 0) recurringType = 'income';
    else if (avgInterval >= 25 && avgInterval <= 35) recurringType = 'subscription';

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

// ═══════════════════════════════════════════════════════════════
// INCREMENTAL TRANSACTION SYNC (/transactions/sync + cursor)
// Uses cursor-based pagination for production-grade incremental sync.
// Deduplicates by transaction_id. Handles added, modified, removed.
// ═══════════════════════════════════════════════════════════════

async function syncTransactionsIncremental(base44: any, plaidItem: any, accessToken: string) {
  let cursor = plaidItem.sync_cursor || '';
  let hasMore = true;
  let totalAdded = 0, totalModified = 0, totalRemoved = 0;
  const allAdded: any[] = [], allModified: any[] = [], allRemoved: any[] = [];

  while (hasMore) {
    const res = await plaidRequestWithRetry('/transactions/sync', {
      access_token: accessToken,
      cursor,
    });

    allAdded.push(...(res.added || []));
    allModified.push(...(res.modified || []));
    allRemoved.push(...(res.removed || []));
    totalAdded += (res.added || []).length;
    totalModified += (res.modified || []).length;
    totalRemoved += (res.removed || []).length;

    cursor = res.next_cursor;
    hasMore = res.has_more;
  }

  // ─── Upsert added/modified into BankTransaction (dedup by transaction_id) ───
  if (allAdded.length > 0 || allModified.length > 0) {
    const txns = [...allAdded, ...allModified];
    const existing = await base44.asServiceRole.entities.BankTransaction.filter({});
    const txnMap = new Map(existing.map((e: any) => [e.transaction_id, e]));
    const toCreate: any[] = [], toUpdate: any[] = [];
    for (const t of txns) {
      const txnData = {
        transaction_id: t.transaction_id,
        name: t.name,
        merchant_name: t.merchant_name,
        amount: t.amount,
        date: t.date,
        category: t.category ? t.category[0] : null,
        account_id: t.account_id,
      };
      if (txnMap.has(t.transaction_id)) {
        toUpdate.push({ id: txnMap.get(t.transaction_id).id, ...txnData });
      } else {
        toCreate.push(txnData);
      }
    }
    if (toCreate.length > 0) await base44.asServiceRole.entities.BankTransaction.bulkCreate(toCreate);
    if (toUpdate.length > 0) await base44.asServiceRole.entities.BankTransaction.bulkUpdate(toUpdate);

    // ─── Sync into UnifiedTransaction (dedup by source_hash) ───
    const unifiedExisting = await base44.asServiceRole.entities.UnifiedTransaction.filter({ source: 'plaid' });
    const unifiedMap = new Map(unifiedExisting.map((e: any) => [e.source_hash, e]));
    const unifiedToCreate: any[] = [];
    for (const t of txns) {
      const merchant = t.merchant_name || t.name || 'Unknown';
      const hash = makeUnifiedHash(t.date, merchant, t.amount, 'USD');
      if (unifiedMap.has(hash)) continue;
      unifiedMap.set(hash, true);
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
      });
    }
    if (unifiedToCreate.length > 0) {
      await base44.asServiceRole.entities.UnifiedTransaction.bulkCreate(unifiedToCreate);
    }
  }

  // ─── Process removed transactions ───
  if (allRemoved.length > 0) {
    const removedIds = allRemoved.map((r: any) => r.transaction_id);
    const existingRemoved = await base44.asServiceRole.entities.BankTransaction.filter({});
    for (const t of existingRemoved) {
      if (removedIds.includes(t.transaction_id)) {
        await base44.asServiceRole.entities.BankTransaction.delete(t.id);
      }
    }
  }

  // ─── Update cursor and clear errors ───
  await base44.asServiceRole.entities.PlaidItem.update(plaidItem.id, {
    sync_cursor: cursor,
    last_sync_date: new Date().toISOString(),
    status: 'active',
    last_error_code: null,
    last_error_type: null,
    last_error_message: null,
  });

  return { added: totalAdded, modified: totalModified, removed: totalRemoved, cursor };
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNT SYNC
// ═══════════════════════════════════════════════════════════════

async function syncAccounts(base44: any, accessToken: string, institutionName: string) {
  const res = await plaidRequestWithRetry('/accounts/balance/get', { access_token: accessToken });
  const now = new Date().toISOString();
  const accounts = res.accounts.map((a: any) => ({
    account_id: a.account_id,
    name: a.name,
    official_name: a.official_name,
    type: a.type,
    subtype: a.subtype,
    mask: a.mask,
    current_balance: a.balances?.current,
    available_balance: a.balances?.available,
    currency: a.balances?.iso_currency_code,
    institution_name: institutionName || 'Unknown Bank',
    last_synced: now,
  }));

  const existing = await base44.asServiceRole.entities.BankAccount.filter({});
  const existingMap = new Map(existing.map((e: any) => [e.account_id, e]));
  for (const acc of accounts) {
    if (existingMap.has(acc.account_id)) {
      await base44.asServiceRole.entities.BankAccount.update(existingMap.get(acc.account_id).id, acc);
    } else {
      await base44.asServiceRole.entities.BankAccount.create(acc);
    }
  }
  return accounts;
}

// ═══════════════════════════════════════════════════════════════
// SYNC RATE LIMITING
// ═══════════════════════════════════════════════════════════════

function isSameDay(dateStr1: string, dateStr2: string): boolean {
  if (!dateStr1 || !dateStr2) return false;
  return dateStr1.split('T')[0] === dateStr2.split('T')[0];
}

async function countSyncsToday(base44: any, userId: string, syncType: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const records = await base44.asServiceRole.entities.CreditTransaction.filter(
    { feature_name: syncType, created_by_id: userId },
    '-created_date', 50
  ).catch(() => []);
  return records.filter((r: any) => new Date(r.created_date) >= todayStart).length;
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const { action, public_token, start_date, end_date, item_id, force_refresh } = payload;

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by_id: user.id });
    const profile = profiles[0];

    // ─── Test: no premium required ───
    if (action === 'test') {
      try {
        const res = await plaidRequest('/link/token/create', {
          user: { client_user_id: 'test_user' },
          client_name: 'Nudigo',
          products: ['transactions'],
          country_codes: ['US'],
          language: 'en',
        });
        return Response.json({
          success: true, environment: PLAID_ENV,
          linkTokenReceived: !!res.link_token,
          message: 'Plaid credentials are valid and working.'
        });
      } catch (error: any) {
        console.error('Plaid test error:', error.message);
        return Response.json({ success: false, error: error.message, environment: PLAID_ENV }, { status: 500 });
      }
    }

    // ─── Premium check ───
    const isPremium = profile && (
      profile.is_premium ||
      profile.plan_type === 'pro' ||
      (profile.subscription_status === 'active' && profile.subscription_plan === 'pro') ||
      (profile.premium_trial_end_date && new Date(profile.premium_trial_end_date) > new Date())
    );
    if (!isPremium) {
      return Response.json({ error: 'Bank sync is a Premium feature. Upgrade to Pro to connect your bank.', needs_upgrade: true }, { status: 403 });
    }

    // ═════ CREATE LINK TOKEN ═════
    // Supports initial connection and update mode (re-authentication)
    if (action === 'create_link_token') {
      const origin = req.headers.get('origin') || '';
      const linkBody: any = {
        user: { client_user_id: user.id },
        client_name: 'Nudigo',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      };

      // Update mode: pass access_token for re-authentication of existing item
      if (item_id) {
        const items = await base44.asServiceRole.entities.PlaidItem.filter({ item_id, created_by_id: user.id });
        if (!items.length) return Response.json({ error: 'Item not found' }, { status: 404 });
        const accessToken = await decryptToken(items[0].encrypted_access_token, items[0].encryption_iv);
        linkBody.access_token = accessToken;
        delete linkBody.products; // not allowed in update mode
      }

      if (origin) linkBody.webhook = `${origin}/api/function/plaid-webhook`;

      const res = await plaidRequestWithRetry('/link/token/create', linkBody);
      return Response.json({ link_token: res.link_token, env: PLAID_ENV });
    }

    // ═════ EXCHANGE PUBLIC TOKEN ═════
    // Stores encrypted access token in PlaidItem (never in UserProfile)
    if (action === 'exchange_public_token') {
      if (!public_token) return Response.json({ error: 'public_token is required' }, { status: 400 });
      const res = await plaidRequestWithRetry('/item/public_token/exchange', { public_token });

      // Get institution info
      let institutionName = 'Unknown Bank';
      let institutionId: string | null = null;
      try {
        const itemRes = await plaidRequest('/item/get', { access_token: res.access_token });
        if (itemRes.item?.institution_id) {
          institutionId = itemRes.item.institution_id;
          const instRes = await plaidRequest('/institutions/get_by_id', {
            institution_id: institutionId, country_codes: ['US'],
          });
          if (instRes.institution) institutionName = instRes.institution.name;
        }
      } catch {}

      // Encrypt and store
      const { encrypted, iv } = await encryptToken(res.access_token);

      // If this item already exists (re-auth via update mode), update it; otherwise create
      const existingItems = await base44.asServiceRole.entities.PlaidItem.filter({ item_id: res.item_id, created_by_id: user.id });
      if (existingItems.length > 0) {
        await base44.asServiceRole.entities.PlaidItem.update(existingItems[0].id, {
          encrypted_access_token: encrypted,
          encryption_iv: iv,
          status: 'active',
          last_error_code: null,
          last_error_type: null,
          last_error_message: null,
        });
      } else {
        await base44.asServiceRole.entities.PlaidItem.create({
          item_id: res.item_id,
          encrypted_access_token: encrypted,
          encryption_iv: iv,
          status: 'active',
          institution_id: institutionId,
          institution_name: institutionName,
          products: ['transactions'],
          last_sync_date: new Date().toISOString(),
        });
      }

      if (profile) {
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          connected_bank: true,
          plaid_institution_name: institutionName,
          plaid_access_token: null, // Clear legacy plaintext field
          plaid_item_id: res.item_id,
          plaid_last_sync_date: new Date().toISOString(),
        });
      }

      return Response.json({ success: true, item_id: res.item_id, institution_name: institutionName });
    }

    // ═════ GET ACCOUNTS ═════
    if (action === 'get_accounts') {
      const items = await base44.asServiceRole.entities.PlaidItem.filter({ created_by_id: user.id });
      if (!items.length) return Response.json({ error: 'No bank account connected' }, { status: 400 });

      const allAccounts: any[] = [];
      for (const item of items) {
        if (item.status === 'error') continue;
        try {
          const accessToken = await decryptToken(item.encrypted_access_token, item.encryption_iv);
          const accounts = await syncAccounts(base44, accessToken, item.institution_name);
          allAccounts.push(...accounts);
        } catch (err: any) {
          if (isTokenError(err)) {
            await base44.asServiceRole.entities.PlaidItem.update(item.id, {
              status: 'relink_needed',
              last_error_code: err.plaid_error_code,
              last_error_type: err.plaid_error_type,
              last_error_message: err.message,
            });
          }
          console.error(`Account sync error for item ${item.item_id}:`, err.message);
        }
      }
      return Response.json({ accounts: allAccounts });
    }

    // ═════ GET TRANSACTIONS (paginated by date range) ═════
    if (action === 'get_transactions') {
      const items = await base44.asServiceRole.entities.PlaidItem.filter({ created_by_id: user.id });
      if (!items.length) return Response.json({ error: 'No bank account connected' }, { status: 400 });

      const end = end_date || new Date().toISOString().split('T')[0];
      const start = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const allTransactions: any[] = [];
      for (const item of items) {
        if (item.status === 'error') continue;
        try {
          const accessToken = await decryptToken(item.encrypted_access_token, item.encryption_iv);
          const res = await plaidRequestWithRetry('/transactions/get', {
            access_token: accessToken,
            start_date: start, end_date: end,
            options: { count: 100, offset: 0 },
          });
          allTransactions.push(...res.transactions.map((t: any) => ({
            transaction_id: t.transaction_id,
            name: t.name,
            merchant_name: t.merchant_name,
            amount: t.amount,
            date: t.date,
            category: t.category ? t.category[0] : null,
            account_id: t.account_id,
          })));
        } catch (err: any) {
          if (isTokenError(err)) {
            await base44.asServiceRole.entities.PlaidItem.update(item.id, {
              status: 'relink_needed',
              last_error_code: err.plaid_error_code,
            });
          }
        }
      }
      return Response.json({ transactions: allTransactions, total_count: allTransactions.length });
    }

    // ═════ FULL SYNC (accounts + incremental transactions + recurring) ═════
    if (action === 'sync_data') {
      const items = await base44.asServiceRole.entities.PlaidItem.filter({ created_by_id: user.id });
      if (!items.length) return Response.json({ error: 'No bank account connected' }, { status: 400 });

      // Rate limit
      const syncsToday = await countSyncsToday(base44, user.id, 'plaid_sync');
      if (syncsToday >= MAX_FULL_SYNCS_PER_DAY && !force_refresh) {
        return Response.json({ error: 'Daily sync limit reached. Try again tomorrow.' }, { status: 429 });
      }

      let totalAccounts = 0, totalAdded = 0, totalModified = 0, totalRemoved = 0;
      let needsReconnect = false;
      const allRecurring: any[] = [];

      for (const item of items) {
        if (item.status === 'error') continue;
        try {
          const accessToken = await decryptToken(item.encrypted_access_token, item.encryption_iv);

          // Sync accounts
          const accounts = await syncAccounts(base44, accessToken, item.institution_name);
          totalAccounts += accounts.length;

          // Incremental transaction sync (uses cursor)
          const syncResult = await syncTransactionsIncremental(base44, item, accessToken);
          totalAdded += syncResult.added;
          totalModified += syncResult.modified;
          totalRemoved += syncResult.removed;

          // Recurring detection (last 90 days)
          const end = new Date().toISOString().split('T')[0];
          const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const txnsRes = await plaidRequestWithRetry('/transactions/get', {
            access_token: accessToken, start_date: start, end_date: end,
            options: { count: 250, offset: 0 },
          });
          const recurring = detectRecurring(txnsRes.transactions);
          allRecurring.push(...recurring);

          // Mark recurring in UnifiedTransaction
          for (const r of recurring) {
            const unifiedTxns = await base44.asServiceRole.entities.UnifiedTransaction.filter({
              source: 'plaid', normalized_merchant: r.merchant,
            });
            for (const ut of unifiedTxns) {
              await base44.asServiceRole.entities.UnifiedTransaction.update(ut.id, {
                is_recurring: true, recurring_type: r.type,
              });
            }
          }
        } catch (err: any) {
          if (isTokenError(err)) {
            await base44.asServiceRole.entities.PlaidItem.update(item.id, {
              status: 'relink_needed',
              last_error_code: err.plaid_error_code,
              last_error_type: err.plaid_error_type,
            });
            needsReconnect = true;
          }
          console.error(`Sync error for item ${item.item_id}:`, err.message);
        }
      }

      if (profile) {
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          plaid_last_sync_date: new Date().toISOString(),
        });
      }

      // Log sync for rate limiting
      await base44.asServiceRole.entities.CreditTransaction.create({
        feature_name: 'plaid_sync', credits_spent: 0, balance_after: profile?.credits_balance || 0,
      });

      const incomeRecurring = allRecurring.filter(r => r.type === 'income');
      const nextPaycheck = incomeRecurring.length > 0
        ? new Date(Date.now() + incomeRecurring[0].interval_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      return Response.json({
        success: true,
        synced_at: new Date().toISOString(),
        accounts_synced: totalAccounts,
        transactions_added: totalAdded,
        transactions_modified: totalModified,
        transactions_removed: totalRemoved,
        recurring_detected: allRecurring.length,
        recurring: allRecurring,
        next_estimated_paycheck: nextPaycheck,
        needs_reconnect: needsReconnect,
      });
    }

    // ═════ GET RECURRING ═════
    if (action === 'get_recurring') {
      const items = await base44.asServiceRole.entities.PlaidItem.filter({ created_by_id: user.id });
      if (!items.length) return Response.json({ error: 'No bank account connected' }, { status: 400 });

      const allRecurring: any[] = [];
      let needsReconnect = false;

      for (const item of items) {
        if (item.status === 'error') continue;
        try {
          const accessToken = await decryptToken(item.encrypted_access_token, item.encryption_iv);
          const end = new Date().toISOString().split('T')[0];
          const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const res = await plaidRequestWithRetry('/transactions/get', {
            access_token: accessToken, start_date: start, end_date: end,
            options: { count: 250, offset: 0 },
          });
          allRecurring.push(...detectRecurring(res.transactions));
        } catch (err: any) {
          if (isTokenError(err)) {
            await base44.asServiceRole.entities.PlaidItem.update(item.id, {
              status: 'relink_needed', last_error_code: err.plaid_error_code,
            });
            needsReconnect = true;
          }
        }
      }

      const income = allRecurring.filter(r => r.type === 'income');
      const nextPaycheck = income.length > 0
        ? new Date(Date.now() + income[0].interval_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      return Response.json({ recurring: allRecurring, next_estimated_paycheck: nextPaycheck, needs_reconnect: needsReconnect });
    }

    // ═════ DISCONNECT (full data deletion — GDPR-compliant) ═════
    if (action === 'disconnect') {
      const items = await base44.asServiceRole.entities.PlaidItem.filter({ created_by_id: user.id });
      for (const item of items) {
        try {
          const accessToken = await decryptToken(item.encrypted_access_token, item.encryption_iv);
          await plaidRequest('/item/remove', { access_token: accessToken });
        } catch (err: any) {
          console.error(`Error removing item ${item.item_id}:`, err.message);
        }
        await base44.asServiceRole.entities.PlaidItem.delete(item.id);
      }

      // Delete all synced financial data
      await base44.asServiceRole.entities.BankAccount.deleteMany({});
      await base44.asServiceRole.entities.BankTransaction.deleteMany({});
      await base44.asServiceRole.entities.UnifiedTransaction.deleteMany({ source: 'plaid' });

      if (profile) {
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          connected_bank: false,
          plaid_access_token: null,
          plaid_item_id: null,
          plaid_institution_name: null,
          plaid_last_sync_date: null,
        });
      }
      return Response.json({ success: true });
    }

    // ═════ GET STATUS ═════
    if (action === 'get_status') {
      const items = await base44.asServiceRole.entities.PlaidItem.filter({ created_by_id: user.id });
      const accountCount = (await base44.asServiceRole.entities.BankAccount.filter({})).length;
      const transactionCount = (await base44.asServiceRole.entities.BankTransaction.filter({})).length;

      const itemStatuses = items.map((item: any) => ({
        item_id: item.item_id,
        institution_name: item.institution_name,
        status: item.status,
        last_sync: item.last_sync_date,
        needs_reconnect: item.status === 'relink_needed' || item.status === 'error' || item.status === 'degraded',
      }));

      return Response.json({
        connected: items.length > 0,
        env: PLAID_ENV,
        items: itemStatuses,
        needs_reconnect: itemStatuses.some(i => i.needs_reconnect),
        account_count: accountCount,
        transaction_count: transactionCount,
        last_sync: items[0]?.last_sync_date || null,
        institution_name: items[0]?.institution_name || null,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Plaid function error:', error.message);
    const mapped = mapPlaidError(error);
    return Response.json({
      error: mapped.safeMessage,
      needs_reconnect: mapped.needsReconnect || false,
    }, { status: 500 });
  }
});