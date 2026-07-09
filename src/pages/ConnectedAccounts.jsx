import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency, clearUserDataCache } from '@/lib/nudgeUtils';
import { isPremiumUser } from '@/lib/usePremium';
import { ArrowLeft, Landmark, Lock, ArrowRight, PiggyBank } from 'lucide-react';
import GoogleCalendarSync from '@/components/GoogleCalendarSync';
import UnderConstruction from '@/components/UnderConstruction';

export default function ConnectedAccounts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeValue, setIncomeValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const profiles = await base44.entities.UserProfile.list();
      const p = profiles[0];
      setProfile(p);
      if (p?.monthly_income) setIncomeValue(String(p.monthly_income));
    } catch {}
    setLoading(false);
  }

  async function saveIncome() {
    const income = parseFloat(incomeValue) || 0;
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, { monthly_income: income });
      clearUserDataCache();
      setProfile({ ...profile, monthly_income: income });
      setEditingIncome(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Non-premium users cannot access bank features
  if (!isPremiumUser(profile)) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
        <button onClick={() => navigate('/profile')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Profile
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Landmark className="w-6 h-6 text-primary" />
          <h1 className="text-2xl bold font-heading">Connected Accounts</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Bank connections require Premium</p>

        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">Bank sync is a Premium feature</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">Upgrade to Premium to connect your bank via Plaid and automatically sync transactions, balances, and recurring bills.</p>
          <Link to="/pricing" className="inline-flex items-center gap-1 text-sm font-medium text-primary-foreground bg-primary px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
            View plans <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <GoogleCalendarSync />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <button onClick={() => navigate('/profile')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Profile
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Landmark className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold font-heading">Connected Accounts</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Manage your connected services</p>

      {/* Google Calendar sync */}
      <GoogleCalendarSync />

      {/* Monthly Income — editable */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <PiggyBank className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Monthly Income</h2>
        </div>
        {editingIncome ? (
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={incomeValue}
                onChange={e => setIncomeValue(e.target.value)}
                placeholder="5,000"
                className="w-full bg-surface-1 border border-border rounded-xl pl-8 pr-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingIncome(false); setIncomeValue(String(profile?.monthly_income || '')); }} className="flex-1 text-sm text-muted-foreground py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 transition-colors">Cancel</button>
              <button onClick={saveIncome} className="flex-1 text-sm font-medium text-primary-foreground bg-primary py-2.5 rounded-xl hover:bg-primary/90 transition-colors">Save</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{profile?.monthly_income ? formatCurrency(profile.monthly_income) : 'Not set'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your monthly take-home pay</p>
            </div>
            <button onClick={() => setEditingIncome(true)} className="text-sm font-medium text-primary px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/15 transition-colors">
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Bank connection — under construction */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Bank Account</h2>
        </div>
        <UnderConstruction
          title="Under Construction"
          message="Bank connection is being upgraded. Check back soon for a better experience!"
        />
      </div>
    </div>
  );
}