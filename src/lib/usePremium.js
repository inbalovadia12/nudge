import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Premium Beta: disabled — real paywalls active
const PREMIUM_BETA = false;

export function isPremiumUser(profile) {
  if (PREMIUM_BETA) return true;
  if (!profile) return false;
  if (profile.is_premium) return true;
  if (profile.plan_type === 'pro' || profile.plan_type === 'plus') return true;
  if (profile.subscription_status === 'active' && (profile.subscription_plan === 'pro' || profile.subscription_plan === 'plus')) return true;
  if (profile.premium_trial_end_date && new Date(profile.premium_trial_end_date) > new Date()) return true;
  return false;
}

export function usePremiumStatus() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the user's own profile directly — never use the shared cache,
    // which can carry a previous user's premium status across sessions.
    base44.entities.UserProfile.list()
      .then(profiles => setProfile(profiles[0] || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { 
    isPremium: isPremiumUser(profile), 
    profile, 
    loading,
    isBeta: PREMIUM_BETA 
  };
}