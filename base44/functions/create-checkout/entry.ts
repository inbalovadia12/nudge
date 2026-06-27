import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PLANS = {
  plus_monthly: {
    name: 'Vesper Plus - Monthly',
    price: '4.99',
    subscriptionInfo: {
      subscriptionSettings: { frequency: 'MONTH' },
      title: 'Vesper Plus Monthly',
      description: 'All premium insights and tools, billed monthly',
    },
  },
  plus_yearly: {
    name: 'Vesper Plus - Annual',
    price: '39.99',
    subscriptionInfo: {
      subscriptionSettings: { frequency: 'YEAR' },
      title: 'Vesper Plus Annual',
      description: 'All premium insights and tools, billed yearly',
    },
  },
  pro_monthly: {
    name: 'Vesper Pro - Monthly',
    price: '9.99',
    subscriptionInfo: {
      subscriptionSettings: { frequency: 'MONTH' },
      title: 'Vesper Pro Monthly',
      description: 'Advanced AI tools for deep financial transformation, billed monthly',
    },
  },
  pro_yearly: {
    name: 'Vesper Pro - Annual',
    price: '79.99',
    subscriptionInfo: {
      subscriptionSettings: { frequency: 'YEAR' },
      title: 'Vesper Pro Annual',
      description: 'Advanced AI tools for deep financial transformation, billed yearly',
    },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const origin = req.headers.get('origin');

    if (!origin) {
      return Response.json({ error: 'Missing origin header' }, { status: 400 });
    }

    // Cancel subscription
    if (body.action === 'cancel') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const profiles = await base44.entities.UserProfile.filter({ created_by_id: user.id });
      if (!profiles.length) return Response.json({ error: 'Profile not found' }, { status: 404 });
      const profile = profiles[0];

      if (!profile.subscription_id) return Response.json({ error: 'No active subscription' }, { status: 400 });

      const cancelRes = await fetch(
        `https://www.wixapis.com/payments/base44/v1/subscriptions/${profile.subscription_id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': Deno.env.get('PAYMENTS_BY_WIX_API_KEY'),
            'wix-site-id': Deno.env.get('PAYMENTS_BY_WIX_SITE_ID'),
          },
          body: JSON.stringify({
            subscription_id: profile.subscription_id,
            immediate: false,
            reason: 'User requested cancellation',
          }),
        }
      );

      if (!cancelRes.ok) {
        const errData = await cancelRes.json().catch(() => ({}));
        console.error('Cancel error:', JSON.stringify(errData));
        return Response.json({ error: 'Failed to cancel subscription' }, { status: 500 });
      }

      await base44.entities.UserProfile.update(profile.id, { subscription_status: 'canceled' });
      return Response.json({ success: true });
    }

    // Create checkout
    const plan = body.plan;
    const planConfig = PLANS[plan];
    if (!planConfig) return Response.json({ error: 'Invalid plan' }, { status: 400 });

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const response = await fetch(
      'https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': Deno.env.get('PAYMENTS_BY_WIX_API_KEY'),
          'wix-site-id': Deno.env.get('PAYMENTS_BY_WIX_SITE_ID'),
        },
        body: JSON.stringify({
          cart: {
            items: [{
              name: planConfig.name,
              quantity: 1,
              price: planConfig.price,
              subscriptionInfo: planConfig.subscriptionInfo,
            }],
            customerInfo: { email: user.email },
          },
          callbackUrls: {
            postFlowUrl: origin + '/profile',
            thankYouPageUrl: origin + '/profile',
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('Wix checkout error:', JSON.stringify(data));
      return Response.json({ error: data.message || 'Checkout failed' }, { status: 500 });
    }

    // Store checkout_id for webhook matching
    const profiles = await base44.entities.UserProfile.filter({ created_by_id: user.id });
    if (profiles.length > 0) {
      await base44.entities.UserProfile.update(profiles[0].id, {
        checkout_id: data.checkoutSession.id,
        subscription_status: 'pending',
        subscription_plan: plan,
      });
    }

    return Response.json({ redirectUrl: data.checkoutSession.redirectUrl });
  } catch (error) {
    console.error('Checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});