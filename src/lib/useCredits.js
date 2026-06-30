import { base44 } from '@/api/base44Client';

// Credit costs per feature type — mirrored from backend consume-credits function
export const CREDIT_COSTS = {
  assistant_message: 1,      // Basic AI chat
  transaction_analysis: 2,  // Standard analysis
  calculator_ai_insight: 2, // Standard analysis
  paycheck_wrapped: 2,      // Standard analysis
  purchase_verdict: 3,      // Standard analysis
  deep_insight: 3,          // Standard analysis
  grocery_optimization: 3,  // Standard analysis
  financial_simulation: 4,  // Heavy AI
  deal_finder_search: 5,    // Heavy AI
  bank_sync: 0,             // Free (but premium-gated)
};

export const PLAN_CAPS = { free: 10, plus: 100, pro: 500 };

export const PLAN_FEATURES = {
  free: ['assistant_message', 'purchase_verdict'],
  plus: ['assistant_message', 'purchase_verdict', 'transaction_analysis', 'deep_insight', 'paycheck_wrapped', 'calculator_ai_insight', 'deal_finder_search'],
  pro: ['assistant_message', 'purchase_verdict', 'transaction_analysis', 'deep_insight', 'paycheck_wrapped', 'grocery_optimization', 'financial_simulation', 'calculator_ai_insight', 'deal_finder_search', 'bank_sync'],
};

export async function getCreditStatus() {
  const profiles = await base44.entities.UserProfile.list();
  const profile = profiles[0];
  if (!profile) return { balance: 0, plan: 'free', cap: 10, profile: null };
  const plan = profile.plan_type || 'free';
  return {
    balance: profile.credits_balance ?? 0,
    plan,
    cap: PLAN_CAPS[plan] ?? 10,
    profile,
  };
}

// Check if a feature is accessible (plan + balance) without deducting
export async function checkFeatureAccess(featureName) {
  const { balance, plan, cap, profile } = await getCreditStatus();
  const cost = CREDIT_COSTS[featureName] ?? 1;
  const allowed = PLAN_FEATURES[plan] || PLAN_FEATURES.free;

  if (!allowed.includes(featureName)) {
    return { canUse: false, reason: 'plan_locked', cost, balance, plan, cap, profile };
  }
  if (balance < cost) {
    return { canUse: false, reason: 'insufficient_credits', cost, balance, plan, cap, profile };
  }
  return { canUse: true, cost, balance, plan, cap, profile };
}

// Spend credits via backend gateway — enforces all rules server-side
// Returns { success, balance, cost, plan, cap, reason?, message? }
export async function spendCredits(featureName) {
  try {
    const response = await base44.functions.invoke('consume-credits', {
      feature_name: featureName,
    });
    return response.data;
  } catch (err) {
    // Axios wraps the response — extract the server's error body
    const data = err?.response?.data || {};
    return {
      success: false,
      reason: data.reason || 'error',
      message: data.message || data.error || 'Something went wrong. Please try again.',
      cost: CREDIT_COSTS[featureName] ?? 1,
      balance: 0,
    };
  }
}