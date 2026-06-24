import { useState, useEffect } from 'react';
import { getFinancialContext } from '@/lib/nudgeUtils';

// Premium Beta: all features unlocked for all users
const PREMIUM_BETA = true;

export function isPremiumUser(profile) {
  if (PREMIUM_BETA) return true;
  if (!profile) return false;
  if (profile.is_premium) return true;
  if (profile.premium_trial_end_date && new Date(profile.premium_trial_end_date) > new Date()) return true;
  return false;
}

export function usePremiumStatus() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFinancialContext()
      .then(ctx => setProfile(ctx.profile))
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