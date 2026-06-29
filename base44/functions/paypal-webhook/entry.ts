import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ENV = Deno.env.get('PAYPAL_ENV') || 'sandbox';
const BASE_URL = ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

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

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');
    if (!webhookId) {
      console.error('Missing PAYPAL_WEBHOOK_ID');
      return Response.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const token = await getAccessToken();
    const verifyRes = await fetch(`${BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo: req.headers.get('paypal-auth-algo'),
        cert_url: req.headers.get('paypal-cert-url'),
        transmission_id: req.headers.get('paypal-transmission-id'),
        transmission_sig: req.headers.get('paypal-transmission-sig'),
        transmission_time: req.headers.get('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: event,
      }),
    });
    const verifyData = await verifyRes.json();

    if (verifyData.verification_status !== 'SUCCESS') {
      console.error('Webhook verification failed:', verifyData.verification_status);
      return Response.json({ error: 'Verification failed' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const subscriptionId = event.resource?.id;
    const eventType = event.event_type;

    if (!subscriptionId) {
      console.log('No subscription ID in webhook event');
      return Response.json({ success: true });
    }

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ subscription_id: subscriptionId });
      if (profiles.length > 0) {
        const profile = profiles[0];
        const updates = { is_premium: true, subscription_status: 'active' };

        const plan = profile.subscription_plan || '';
        if (plan.startsWith('plus')) {
          updates.credits_balance = 100;
          updates.plan_type = 'plus';
        } else if (plan.startsWith('pro')) {
          updates.credits_balance = 500;
          updates.plan_type = 'pro';
        }

        await base44.asServiceRole.entities.UserProfile.update(profile.id, updates);
        console.log('Premium activated for subscription:', subscriptionId);
      } else {
        console.log('No profile found for subscription:', subscriptionId);
      }
    } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' || eventType === 'BILLING.SUBSCRIPTION.EXPIRED') {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ subscription_id: subscriptionId });
      if (profiles.length > 0) {
        await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
          is_premium: false,
          subscription_status: eventType.includes('CANCELLED') ? 'canceled' : 'expired',
        });
        console.log('Subscription deactivated:', subscriptionId);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});