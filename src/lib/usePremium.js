import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function isPremiumUser(profile) {
  if (!profile) return false;
  if (profile.is_premium) return true;
  if (profile.premium_trial_end_date && new Date(profile.premium_trial_end_date) > new Date()) return true;
  return false;
}

export function usePremiumStatus() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.UserProfile.list()
      .then(p => setProfile(p[0]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { isPremium: isPremiumUser(profile), profile, loading };
}