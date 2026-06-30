import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Monthly credit reset — runs on the 1st of each month
// Resets all users to their plan cap. No roll-over.

const PLAN_CAPS = { free: 10, plus: 100, pro: 500 };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch all profiles (service role for admin access)
    let allProfiles = [];
    let skip = 0;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.UserProfile.list('-created_date', 100, skip);
      allProfiles = allProfiles.concat(batch);
      hasMore = batch.length === 100;
      skip += 100;
    }

    let resetCount = 0;
    for (const profile of allProfiles) {
      let plan = profile.plan_type || 'free';
      if (!PLAN_CAPS[plan]) {
        if (profile.subscription_status === 'active' && profile.subscription_plan) {
          plan = profile.subscription_plan.startsWith('pro') ? 'pro' : 'plus';
        } else {
          plan = 'free';
        }
      }
      const cap = PLAN_CAPS[plan] ?? 10;
      await base44.asServiceRole.entities.UserProfile.update(profile.id, { credits_balance: cap });
      resetCount++;
    }

    console.log(`Monthly reset complete: ${resetCount} profiles reset`);
    return Response.json({ success: true, reset_count: resetCount });
  } catch (error) {
    console.error('reset-credits-monthly error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});