import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ENV = Deno.env.get('PAYPAL_ENV') || 'sandbox';
const BASE_URL = ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

const PLANS = {
  plus_monthly: { productName: 'Nudigo Plus', planName: 'Nudigo Plus Monthly', price: '4.99', interval_unit: 'MONTH', interval_count: 1, credits: 100, planType: 'plus' },
  plus_yearly: { productName: 'Nudigo Plus', planName: 'Nudigo Plus Annual', price: '39.99', interval_unit: 'YEAR', interval_count: 1, credits: 100, planType: 'plus' },
  pro_monthly: { productName: 'Nudigo Pro', planName: 'Nudigo Pro Monthly', price: '9.99', interval_unit: 'MONTH', interval_count: 1, credits: 500, planType: 'pro' },
  pro_yearly: { productName: 'Nudigo Pro', planName: 'Nudigo Pro Annual', price: '79.99', interval_unit: 'YEAR', interval_count: 1, credits: 500, planType: 'pro' },
};

async function getAccessToken() {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('PayPal credentials not configured');
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${data.error_description || data.error}`);
  return data.access_token;
}

async function ensureProduct(token, name) {
  const listRes = await fetch(`${BASE_URL}/v1/catalogs/products?page_size=20&total_required=true`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const listData = await listRes.json();
  const existing = listData.products?.find(p => p.name === name);
  if (existing) return existing.id;

  const createRes = await fetch(`${BASE_URL}/v1/catalogs/products`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description: `${name} subscription plan`, type: 'SERVICE', category: 'SOFTWARE' }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(`Failed to create product: ${createData.message || JSON.stringify(createData)}`);
  return createData.id;
}

async function ensurePlan(token, productId, config) {
  const listRes = await fetch(`${BASE_URL}/v1/billing/plans?product_id=${productId}&page_size=20&total_required=true`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const listData = await listRes.json();
  const existing = listData.plans?.find(p => p.name === config.planName && p.status === 'ACTIVE');
  if (existing) return existing.id;

  const createRes = await fetch(`${BASE_URL}/v1/billing/plans`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify({
      product_id: productId,
      name: config.planName,
      description: config.planName,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: { interval_unit: config.interval_unit, interval_count: config.interval_count },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: config.price, currency_code: 'USD' } },
      }],
      payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 3 },
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(`Failed to create plan: ${createData.message || JSON.stringify(createData)}`);
  return createData.id;
}

async function ensurePlans(token) {
  const productIds = {};
  const productNames = [...new Set(Object.values(PLANS).map(p => p.productName))];
  for (const name of productNames) {
    productIds[name] = await ensureProduct(token, name);
  }

  const planIds = {};
  for (const [key, config] of Object.entries(PLANS)) {
    const productId = productIds[config.productName];
    planIds[key] = await ensurePlan(token, productId, config);
  }
  return planIds;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Cancel subscription
    if (body.action === 'cancel') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const profiles = await base44.entities.UserProfile.filter({ created_by_id: user.id });
      if (!profiles.length) return Response.json({ error: 'Profile not found' }, { status: 404 });
      const profile = profiles[0];

      if (!profile.subscription_id) return Response.json({ error: 'No active subscription' }, { status: 400 });

      const token = await getAccessToken();
      const cancelRes = await fetch(`${BASE_URL}/v1/billing/subscriptions/${profile.subscription_id}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User requested cancellation' }),
      });

      if (!cancelRes.ok) {
        const errData = await cancelRes.json().catch(() => ({}));
        console.error('PayPal cancel error:', JSON.stringify(errData));
        return Response.json({ error: errData.message || 'Failed to cancel subscription' }, { status: 500 });
      }

      await base44.entities.UserProfile.update(profile.id, { subscription_status: 'canceled' });
      return Response.json({ success: true });
    }

    // Create checkout
    const origin = req.headers.get('origin');
    if (!origin) return Response.json({ error: 'Missing origin header' }, { status: 400 });

    const plan = body.plan;
    const planConfig = PLANS[plan];
    if (!planConfig) return Response.json({ error: 'Invalid plan' }, { status: 400 });

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = await getAccessToken();
    const planIds = await ensurePlans(token);
    const planId = planIds[plan];
    if (!planId) return Response.json({ error: 'Plan setup failed' }, { status: 500 });

    const subRes = await fetch(`${BASE_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          brand_name: 'Nudigo',
          return_url: `${origin}/pricing`,
          cancel_url: `${origin}/pricing`,
          user_action: 'SUBSCRIBE_NOW',
        },
      }),
    });

    const subData = await subRes.json();
    if (!subRes.ok) {
      console.error('PayPal subscription error:', JSON.stringify(subData));
      return Response.json({ error: subData.message || 'Subscription creation failed' }, { status: 500 });
    }

    const approveLink = subData.links?.find(l => l.rel === 'approve');
    if (!approveLink) return Response.json({ error: 'No approval URL returned' }, { status: 500 });

    const profiles = await base44.entities.UserProfile.filter({ created_by_id: user.id });
    if (profiles.length > 0) {
      await base44.entities.UserProfile.update(profiles[0].id, {
        subscription_id: subData.id,
        subscription_status: 'pending',
        subscription_plan: plan,
      });
    }

    return Response.json({ redirectUrl: approveLink.href });
  } catch (error) {
    console.error('Checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});