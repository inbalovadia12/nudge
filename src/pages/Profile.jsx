import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from 'next-themes';
import { usePremiumStatus } from '@/lib/usePremium';
import { clearUserDataCache } from '@/lib/nudgeUtils';
import ConnectPlaid from '@/components/ConnectPlaid';
import { Moon, Sun, Bell, Shield, CreditCard, LogOut, ChevronRight, Sparkles, Crown, UserCog, Wallet, Check, Landmark, Bug, FileText } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isPremium, profile, loading } = usePremiumStatus();
  const navigate = useNavigate();
  const [strictness, setStrictness] = useState('moderate');
  const [notifications, setNotifications] = useState({ daily: true, bills: true, deals: true, overspending: true });
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeValue, setIncomeValue] = useState('');
  const [incomeSaved, setIncomeSaved] = useState(false);
  const [bankConnected, setBankConnected] = useState(false);

  useEffect(() => {
    if (profile) setBankConnected(!!profile.connected_bank || !!profile.plaid_access_token);
  }, [profile]);

  const handleDisconnectBank = async () => {
    if (!profile?.id) return;
    await base44.functions.invoke('plaid', { action: 'disconnect' });
    clearUserDataCache();
    setBankConnected(false);
  };

  useEffect(() => {
    if (profile?.strictness) setStrictness(profile.strictness);
    if (profile?.monthly_income) setIncomeValue(String(profile.monthly_income));
  }, [profile]);

  const updateStrictness = async (value) => {
    setStrictness(value);
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, { strictness: value });
      clearUserDataCache();
    }
  };

  const saveIncome = async () => {
    const income = parseFloat(incomeValue) || 0;
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, { monthly_income: income });
      clearUserDataCache();
      setEditingIncome(false);
      setIncomeSaved(true);
      setTimeout(() => setIncomeSaved(false), 2000);
    }
  };

  const trialDays = profile?.premium_trial_end_date
    ? Math.max(0, Math.ceil((new Date(profile.premium_trial_end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const strictnessOptions = [
    { value: 'gentle', label: 'Gentle', desc: 'Encouraging guidance' },
    { value: 'moderate', label: 'Balanced', desc: 'Balanced guidance' },
    { value: 'strict', label: 'Strict', desc: 'Direct feedback' },
  ];

  const Toggle = ({ on, onClick }) => (
    <button onClick={onClick} className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${on ? 'bg-primary' : 'bg-muted'}`}>
      <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <h1 className="text-2xl font-bold font-heading mb-6">Profile</h1>

      {/* User card */}
      <div className="rounded-3xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-2xl">
            {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold">{user?.full_name || 'User'}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Premium status */}
      <div className={`rounded-3xl border p-6 mb-6 ${isPremium ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
        <div className="flex items-center gap-3 mb-3">
          {isPremium ? <Crown className="w-5 h-5 text-primary" /> : <Sparkles className="w-5 h-5 text-muted-foreground" />}
          <div>
            <p className="font-semibold">{isPremium ? 'Thryve Premium' : 'Free Plan'}</p>
            <p className="text-xs text-muted-foreground">
              {isPremium ? 'All features unlocked' : trialDays > 0 ? `${trialDays} days left in your trial` : 'Upgrade for full access'}
            </p>
          </div>
        </div>
        {!isPremium && (
          <Link to="/pricing" className="block w-full bg-primary text-primary-foreground rounded-2xl py-2.5 text-sm font-semibold text-center hover:bg-primary/90 transition-colors">
            {trialDays > 0 ? 'Continue trial' : 'Upgrade to Premium'}
          </Link>
        )}
        {isPremium && (
          <Link to="/pricing" className="block w-full text-sm font-medium text-primary text-center py-2 hover:underline">
            Manage subscription
          </Link>
        )}
      </div>

      {/* Financial Details — editable income */}
      <div className="rounded-3xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-primary" />
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
              <button onClick={saveIncome} disabled={!incomeValue} className="flex-1 text-sm font-medium text-primary-foreground bg-primary py-2.5 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors">Save</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{profile?.monthly_income ? `$${profile.monthly_income.toLocaleString()}` : 'Not set'}</p>
              <p className="text-xs text-muted-foreground mt-1">Your monthly take-home pay</p>
            </div>
            <button onClick={() => setEditingIncome(true)} className="text-sm font-medium text-primary px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/15 transition-colors">
              Edit
            </button>
          </div>
        )}
        {incomeSaved && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 text-xs text-success mt-3">
            <Check className="w-3.5 h-3.5" /> Saved — all your tools are updated.
          </motion.div>
        )}
      </div>

      {/* AI Strictness */}
      <div className="rounded-3xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCog className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">AI Coaching Style</h2>
        </div>
        <div className="space-y-2">
          {strictnessOptions.map(opt => (
            <button key={opt.value} onClick={() => updateStrictness(opt.value)}
              className={`w-full flex items-center justify-between rounded-xl p-3 transition-colors ${strictness === opt.value ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/50 border border-transparent hover:bg-secondary'}`}>
              <div className="text-left">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              {strictness === opt.value && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[10px] text-primary-foreground">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-3xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
          <h2 className="text-sm font-semibold">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-muted-foreground">Easier on the eyes at night</p>
          </div>
          <Toggle on={theme === 'dark'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-3xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Notifications</h2>
        </div>
        <div className="space-y-3">
          {Object.entries({
            daily: { label: 'Daily guidance', desc: 'A friendly morning message' },
            bills: { label: 'Bill reminders', desc: 'Before large expenses' },
            deals: { label: 'Deal alerts', desc: 'When tracked items drop' },
            overspending: { label: 'Overspending warnings', desc: 'When spending spikes' },
          }).map(([key, info]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{info.label}</p>
                <p className="text-xs text-muted-foreground">{info.desc}</p>
              </div>
              <Toggle on={notifications[key]} onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Bank connection via Plaid */}
      <div className="rounded-3xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Bank Account</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Connect your bank via Plaid to automatically track transactions, balances, and bills.
        </p>
        <ConnectPlaid
          connected={bankConnected}
          onConnected={() => { setBankConnected(true); clearUserDataCache(); }}
          onDisconnect={handleDisconnectBank}
        />
        {bankConnected && (
          <button
            onClick={() => navigate('/plaid-sandbox')}
            className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
          >
            <Bug className="w-3.5 h-3.5" /> Plaid Sandbox (dev testing)
          </button>
        )}
      </div>

      {/* Settings list */}
      <div className="rounded-3xl border border-border bg-card p-2 mb-6 space-y-1">
        <button className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 rounded-2xl transition-colors">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Privacy & Security</p>
            <p className="text-xs text-muted-foreground">Data and security settings</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <Link to="/privacy-policy" className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 rounded-2xl transition-colors">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Privacy Policy</p>
            <p className="text-xs text-muted-foreground">How we handle your data</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Sign out */}
      <button onClick={() => logout(false)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-medium text-danger hover:bg-danger/5 transition-colors">
        <LogOut className="w-4 h-4" />
        Sign out
      </button>

      <p className="text-center text-xs text-muted-foreground/50 mt-6">Thryve v2.0 · Your data is private</p>
    </div>
  );
}