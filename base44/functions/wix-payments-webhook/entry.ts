import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import jwt from 'npm:jsonwebtoken@9.0.2';

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const WEBHOOK_PUBLIC_KEY = Deno.env.get('PAYMENTS_BY_WIX_WEBHOOK_PUBLIC_KEY');

    if (!WEBHOOK_PUBLIC_KEY) {
      console.error('Missing PAYMENTS_BY_WIX_WEBHOOK_PUBLIC_KEY');
      return Response.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Step 1: Verify JWT signature — fail closed if key is missing or verification fails
    const rawPayload = jwt.verify(rawBody, WEBHOOK_PUBLIC_KEY, { algorithms: ['RS256'] });

    // Step 2: Parse double-nested JSON (WebhookEnvelope -> event data)
    const event = JSON.parse(rawPayload.data);
    const eventData = JSON.parse(event.data);

    const base44 = createClientFromRequest(req);

    if (event.eventType === 'wix.ecom.v1.order_approved') {
      // Access order through actionEvent.body
      const order = eventData.actionEvent.body.order;
      const checkoutId = order.checkoutId;

      // Match by checkout_id stored during checkout creation
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ checkout_id: checkoutId });
      if (profiles.length > 0) {
        const profile = profiles[0];
        const updates = {
          is_premium: true,
          subscription_status: 'active',
        };

        // Set AI credits based on plan: Plus = 100, Pro = 500
        const plan = profile.subscription_plan || '';
        if (plan.startsWith('plus')) {
          updates.credits_balance = 100;
          updates.plan_type = 'plus';
          updates.subscription_plan = 'plus';
        } else if (plan.startsWith('pro')) {
          updates.credits_balance = 500;
          updates.plan_type = 'pro';
          updates.subscription_plan = 'pro';
        }

        // Store subscription IDs for matching future canceled/expired webhooks
        for (const lineItem of order.lineItems) {
          if (lineItem.subscriptionInfo) {
            updates.subscription_id = lineItem.subscriptionInfo.id;
            break;
          }
        }

        await base44.asServiceRole.entities.UserProfile.update(profile.id, updates);
        console.log('Premium activated for checkout:', checkoutId);
      }
    } else if (
      event.eventType === 'wix.ecom.subscription_contracts.v1.subscription_contract_canceled' ||
      event.eventType === 'wix.ecom.subscription_contracts.v1.subscription_contract_expired'
    ) {
      const subscriptionContract = eventData.actionEvent.body.subscriptionContract;
      const subscriptionId = subscriptionContract.id;

      // Match by subscription_id (stored from order approved webhook)
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ subscription_id: subscriptionId });
      if (profiles.length > 0) {
        const profile = profiles[0];
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          is_premium: false,
          subscription_status: event.eventType.includes('canceled') ? 'canceled' : 'expired',
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