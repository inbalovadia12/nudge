import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PLAID_URL = "https://sandbox.plaid.com";
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
    throw new Error(data.error_message || `Plaid API error: ${res.status}`);
  }
  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { action, public_token, start_date, end_date } = payload;

    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles[0];

    if (action === 'create_link_token') {
      const res = await plaidRequest('/link/token/create', {
        user: { client_user_id: user.id },
        client_name: 'Nudge',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      });
      return Response.json({ link_token: res.link_token });
    }

    if (action === 'exchange_public_token') {
      if (!public_token) return Response.json({ error: 'public_token is required' }, { status: 400 });
      const res = await plaidRequest('/item/public_token/exchange', { public_token });
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, {
          plaid_access_token: res.access_token,
          plaid_item_id: res.item_id,
          connected_bank: true,
        });
      }
      return Response.json({ success: true, item_id: res.item_id });
    }

    if (action === 'get_balances') {
      if (!profile?.plaid_access_token) {
        return Response.json({ error: 'No bank account connected' }, { status: 400 });
      }
      const res = await plaidRequest('/accounts/balance/get', {
        access_token: profile.plaid_access_token,
      });
      const accounts = res.accounts.map(a => ({
        account_id: a.account_id,
        name: a.name,
        type: a.type,
        subtype: a.subtype,
        mask: a.mask,
        current_balance: a.balances?.current,
        available_balance: a.balances?.available,
        currency: a.balances?.iso_currency_code,
      }));
      return Response.json({ accounts });
    }

    if (action === 'get_transactions') {
      if (!profile?.plaid_access_token) {
        return Response.json({ error: 'No bank account connected' }, { status: 400 });
      }
      const end = end_date || new Date().toISOString().split('T')[0];
      const start = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await plaidRequest('/transactions/get', {
        access_token: profile.plaid_access_token,
        start_date: start,
        end_date: end,
        options: { count: 100, offset: 0 },
      });
      const transactions = res.transactions.map(t => ({
        transaction_id: t.transaction_id,
        name: t.name,
        amount: t.amount,
        date: t.date,
        category: t.category ? t.category[0] : null,
        merchant_name: t.merchant_name,
        account_id: t.account_id,
      }));
      return Response.json({ transactions, total_count: res.total_transactions });
    }

    if (action === 'disconnect') {
      if (profile?.plaid_access_token) {
        await base44.entities.UserProfile.update(profile.id, {
          plaid_access_token: null,
          plaid_item_id: null,
          connected_bank: false,
        });
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});