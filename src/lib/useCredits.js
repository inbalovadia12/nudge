import { base44 } from '@/api/base44Client';

export const CREDIT_COSTS = {
  transaction_analysis: 1,
  deep_insight: 2,
  paycheck_wrapped: 2,
  grocery_optimization: 3,
  financial_simulation: 4,
};

export const PLAN_FEATURES = {
  free: ['transaction_analysis', 'deep_insight'],
  plus: ['transaction_analysis', 'deep_insight', 'paycheck_wrapped', 'grocery_optimization'],
  pro: ['transaction_analysis', 'deep_insight', 'paycheck_wrapped', 'grocery_optimization', 'financial_simulation'],
};

export async function getCreditStatus() {
  const profiles = await base44.entities.UserProfile.list();
  const profile = profiles[0];
  if (!profile) return { balance: 0, plan: 'free', profile: null };
  return {
    balance: profile.credits_balance ?? 10,
    plan: profile.plan_type || 'free',
    profile,
  };
}

export async function checkFeatureAccess(featureName, incomeCycleId = null) {
  const { balance, plan, profile } = await getCreditStatus();
  const cost = CREDIT_COSTS[featureName] || 1;
  const allowed = PLAN_FEATURES[plan] || PLAN_FEATURES.free;

  if (!allowed.includes(featureName)) {
    return { canUse: false, reason: 'plan_locked', cost, balance, plan, profile };
  }

  if (balance < cost) {
    return { canUse: false, reason: 'insufficient_credits', cost, balance, plan, profile };
  }

  if (incomeCycleId) {
    const usage = await base44.entities.FeatureUsage.filter({
      feature_name: featureName,
      linked_income_cycle_id: incomeCycleId,
    }).catch(() => []);
    if (usage.length > 0) {
      return { canUse: false, reason: 'already_viewed_cycle', cost, balance, plan, profile };
    }
  }

  return { canUse: true, cost, balance, plan, profile };
}

export async function spendCredits(featureName, incomeCycleId = null, dataHash = null) {
  const access = await checkFeatureAccess(featureName, incomeCycleId);
  if (!access.canUse) return { success: false, ...access };

  const newBalance = (access.profile.credits_balance ?? 10) - access.cost;
  await base44.entities.UserProfile.update(access.profile.id, { credits_balance: newBalance });

  await base44.entities.CreditTransaction.create({
    feature_name: featureName,
    credits_spent: access.cost,
    balance_after: newBalance,
  });

  if (incomeCycleId) {
    await base44.entities.FeatureUsage.create({
      feature_name: featureName,
      linked_income_cycle_id: incomeCycleId,
      cooldown_period: 'cycle',
      generated_data_hash: dataHash,
      last_generated_at: new Date().toISOString(),
    });
  }

  return { success: true, balance: newBalance, cost: access.cost };
}