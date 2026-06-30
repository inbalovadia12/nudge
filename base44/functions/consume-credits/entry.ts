import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─── Credit Economy Configuration ───
const PLAN_CAPS = { free: 10, plus: 100, pro: 500 };
const PLAN_FEATURES = {
  free: ['assistant_message', 'purchase_verdict'],
  plus: ['assistant_message', 'purchase_verdict', 'transaction_analysis', 'deep_insight', 'paycheck_wrapped', 'calculator_ai_insight', 'deal_finder_search'],
  pro: ['assistant_message', 'purchase_verdict', 'transaction_analysis', 'deep_insight', 'paycheck_wrapped', 'grocery_optimization', 'financial_simulation', 'calculator_ai_insight', 'deal_finder_search', 'bank_sync'],
};
const CREDIT_COSTS = {
  assistant_message: 1,
  purchase_verdict: 3,
  transaction_analysis: 2,
  deep_insight: 3,
  paycheck_wrapped: 2,
  grocery_optimization: 3,
  financial_simulation: 4,
  calculator_ai_insight: 2,
  deal_finder_search: 5,
  bank_sync: 0,
};

// Rate limiting: min seconds between same-feature requests
const RATE_LIMIT_SECONDS = 3;
// Daily global cap: 50% of monthly cap (abuse detection)
const DAILY_CAP_RATIO = 0.5;

function isPremiumUser(profile) {
  if (!profile) return false;
  if (profile.is_premium) return true;
  if (profile.plan_type === 'pro' || profile.plan_type === 'plus') return true;
  if (profile.subscription_status === 'active' && (profile.subscription_plan === 'pro' || profile.subscription_plan === 'plus')) return true;
  if (profile.premium_trial_end_date && new Date(profile.premium_trial_end_date) > new Date()) return true;
  return false;
}

function getPlanType(profile) {
  if (profile?.plan_type === 'pro' || profile?.plan_type === 'plus') return profile.plan_type;
  if (profile?.subscription_status === 'active' && profile?.subscription_plan) return profile.subscription_plan.startsWith('pro') ? 'pro' : 'plus';
  return 'free';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { feature_name, data_hash } = body;

    if (!feature_name) return Response.json({ error: 'feature_name is required' }, { status: 400 });

    const cost = CREDIT_COSTS[feature_name] ?? 1;
    const profiles = await base44.entities.UserProfile.filter({ created_by_id: user.id });
    const profile = profiles[0];

    if (!profile) return Response.json({ success: false, reason: 'no_profile', message: 'Profile not found' }, { status: 404 });

    const plan = getPlanType(profile);
    const cap = PLAN_CAPS[plan] ?? 10;
    const balance = profile.credits_balance ?? 0;
    const allowedFeatures = PLAN_FEATURES[plan] ?? PLAN_FEATURES.free;

    // ─── 1. Plan-level feature gate ───
    if (!allowedFeatures.includes(feature_name)) {
      return Response.json({
        success: false,
        reason: 'plan_locked',
        message: feature_name === 'bank_sync'
          ? 'Bank sync is a Premium-only feature. Upgrade to Pro to connect your bank.'
          : `This feature isn't available on the ${plan} plan. Upgrade to unlock it.`,
        cost, balance, plan, cap,
      }, { status: 403 });
    }

    // ─── 2. Hard credit block (no soft overflow) ───
    if (balance < cost) {
      return Response.json({
        success: false,
        reason: 'insufficient_credits',
        message: balance === 0
          ? `You've used all ${cap} credits this month. Credits reset monthly — upgrade for more.`
          : `This action costs ${cost} credits but you only have ${balance} remaining.`,
        cost, balance, plan, cap,
      }, { status: 402 });
    }

    // ─── 3. Rate limiting: prevent rapid consecutive requests ───
    const recentUsage = await base44.asServiceRole.entities.CreditTransaction.filter(
      { feature_name, created_by_id: user.id },
      '-created_date', 1
    ).catch(() => []);
    if (recentUsage.length > 0) {
      const lastTime = new Date(recentUsage[0].created_date).getTime();
      const elapsed = (Date.now() - lastTime) / 1000;
      if (elapsed < RATE_LIMIT_SECONDS) {
        return Response.json({
          success: false,
          reason: 'rate_limited',
          message: `Slow down — please wait ${Math.ceil(RATE_LIMIT_SECONDS - elapsed)}s before trying again.`,
          cost, balance, plan, cap,
          retry_after: Math.ceil(RATE_LIMIT_SECONDS - elapsed),
        }, { status: 429 });
      }
    }

    // ─── 4. Daily global cap: abuse detection ───
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayUsage = await base44.asServiceRole.entities.CreditTransaction.filter(
      { created_by_id: user.id },
      '-created_date', 100
    ).catch(() => []);
    const spentToday = todayUsage
      .filter(t => new Date(t.created_date) >= todayStart)
      .reduce((sum, t) => sum + (t.credits_spent || 0), 0);
    const dailyCap = Math.max(5, Math.floor(cap * DAILY_CAP_RATIO));
    if (spentToday + cost > dailyCap) {
      return Response.json({
        success: false,
        reason: 'daily_cap_exceeded',
        message: `You've hit the daily usage cap (${dailyCap} credits/day). This helps us keep costs sustainable. Try again tomorrow.`,
        cost, balance, plan, cap, spent_today: spentToday, daily_cap: dailyCap,
      }, { status: 429 });
    }

    // ─── 5. Deduct credits atomically (service role) ───
    const newBalance = balance - cost;
    await base44.asServiceRole.entities.UserProfile.update(profile.id, { credits_balance: newBalance });

    // ─── 6. Log transaction for cost monitoring ───
    await base44.asServiceRole.entities.CreditTransaction.create({
      feature_name,
      credits_spent: cost,
      balance_after: newBalance,
    });

    return Response.json({
      success: true,
      balance: newBalance,
      cost,
      plan,
      cap,
      spent_today: spentToday + cost,
      daily_cap: dailyCap,
    });
  } catch (error) {
    console.error('consume-credits error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});