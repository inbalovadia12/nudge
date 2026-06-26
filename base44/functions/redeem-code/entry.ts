import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PREMIUM_CODE = '12252012Io';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return Response.json({ error: 'No code provided' }, { status: 400 });
    }

    if (code !== PREMIUM_CODE) {
      return Response.json({ error: 'Invalid code' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use user-scoped calls so the profile is owned by the user and visible to their frontend queries
    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles.find(p => p.created_by_id === user.id);

    if (profile) {
      const updated = await base44.entities.UserProfile.update(profile.id, {
        plan_type: 'pro',
        is_premium: true,
        subscription_status: 'active',
        subscription_plan: 'pro',
        credits_balance: 500
      });
      return Response.json({ success: true, profile: updated });
    } else {
      const created = await base44.entities.UserProfile.create({
        first_name: user.full_name || user.email.split('@')[0],
        plan_type: 'pro',
        is_premium: true,
        subscription_status: 'active',
        subscription_plan: 'pro',
        credits_balance: 500,
        onboarding_complete: false
      });
      return Response.json({ success: true, profile: created });
    }
  } catch (error) {
    console.error('Redeem code error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});