import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { usePremiumStatus } from '@/lib/usePremium';
import { clearUserDataCache } from '@/lib/nudgeUtils';
import { ArrowLeft, Check, Crown, Loader2, Zap, Shield, TrendingUp, Brain, Target, Clock, Ticket } from 'lucide-react';

const PLANS = {
  plus: {
    name: 'Plus',
    icon: Zap,
    monthly: 4.99,
    yearly: 39.99,
    description: 'Everything you need to build better spending habits',
    features: [
      { icon: Shield, label: 'Shopping Shield with app & site blocker' },
      { icon: TrendingUp, label: 'Spending heatmap & paycheck flow' },
      { icon: Target, label: 'Subscription tracker & cleanup' },
      { icon: Clock, label: 'Deal alerts & price tracking' },
      { icon: Zap, label: 'Money leak detector' },
      { icon: TrendingUp, label: 'Financial Health Score' },
      { icon: Brain, label: 'AI financial assistant' },
      { icon: Target, label: 'Unlimited savings goals' },
    ],
  },
  pro: {
    name: 'Pro',
    icon: Crown,
    monthly: 9.99,
    yearly: 79.99,
    description: 'Advanced AI tools for deep financial transformation',
    features: [
      { icon: Shield, label: 'Everything in Plus' },
      { icon: Brain, label: 'Financial Twin — AI simulation of your finances' },
      { icon: TrendingUp, label: 'Spending simulator & scenario modeling' },
      { icon: Clock, label: 'Regret tracker with purchase reflection' },
      { icon: Brain, label: 'AI spending personality profile' },
      { icon: Target, label: 'Future Feed — 30-day spending predictions' },
      { icon: Zap, label: 'Priority AI responses' },
      { icon: Crown, label: 'Early access to new features' },
    ],
  },
};

export default function Pricing() {
  const navigate = useNavigate();
  const { isPremium, profile, loading } = usePremiumStatus();
  const [billing, setBilling] = useState('yearly');
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  async function handleUpgrade(planName) {
    const planId = `${planName}_${billing}`;
    setCheckoutLoading(planId);
    try {
      const res = await base44.functions.invoke('create-checkout', { plan: planId });
      if (res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
    setCheckoutLoading(null);
  }

  async function handleRedeem() {
    setRedeemLoading(true);
    setRedeemError('');
    try {
      await base44.functions.invoke('redeem-code', { code: redeemCode });
      clearUserDataCache();
      setRedeemSuccess(true);
      setRedeemLoading(false);
      setTimeout(() => window.location.href = '/', 1500);
    } catch (err) {
      setRedeemLoading(false);
      setRedeemError(err?.response?.data?.error || err?.data?.error || 'Invalid code');
    }
  }

  async function handleCancel() {
    setCheckoutLoading('cancel');
    try {
      await base44.functions.invoke('create-checkout', { action: 'cancel' });
      window.location.reload();
    } catch (err) {
      console.error('Cancel error:', err);
    }
    setCheckoutLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-24 lg:pb-6">
      <button onClick={() => navigate('/profile')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Profile
      </button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full mb-4">
          <Crown className="w-3 h-3" /> Nudge Premium
        </div>
        <h1 className="text-3xl font-bold font-heading mb-2">Choose your plan</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Unlock all premium insights and tools to transform your spending habits.</p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="inline-flex items-center bg-surface-2 rounded-xl p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${billing === 'yearly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Yearly
            <span className="text-[10px] bg-success/15 text-success font-bold px-1.5 py-0.5 rounded-full">SAVE 33%</span>
          </button>
        </div>
      </div>

      {/* Current plan status */}
      {isPremium && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mb-6 flex items-center gap-3"
        >
          <Crown className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              You're on the {profile?.subscription_plan?.startsWith('pro') ? 'Pro' : 'Plus'} plan
            </p>
            <p className="text-xs text-muted-foreground capitalize">Status: {profile?.subscription_status || 'active'}</p>
          </div>
          {profile?.subscription_status === 'active' && (
            <button
              onClick={handleCancel}
              disabled={checkoutLoading === 'cancel'}
              className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
            >
              {checkoutLoading === 'cancel' ? 'Canceling...' : 'Cancel plan'}
            </button>
          )}
        </motion.div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(PLANS).map(([key, plan], i) => {
          const price = billing === 'yearly' ? plan.yearly : plan.monthly;
          const period = billing === 'yearly' ? 'year' : 'month';
          const planId = `${key}_${billing}`;
          const isPro = key === 'pro';
          const PlanIcon = plan.icon;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-3xl border-2 p-6 relative flex flex-col ${isPro ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap">
                  Best Value
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <PlanIcon className={`w-5 h-5 ${isPro ? 'text-primary' : 'text-primary'}`} />
                <h3 className="text-lg font-bold">{plan.name}</h3>
              </div>

              <p className="text-xs text-muted-foreground mb-4 min-h-[32px]">{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold">${price}</span>
                <span className="text-sm text-muted-foreground">/{period}</span>
              </div>
              {billing === 'yearly' && (
                <p className="text-xs text-success mb-4">That's ${(price / 12).toFixed(2)}/mo, billed annually</p>
              )}
              {billing === 'monthly' && <div className="mb-4" />}

              <button
                onClick={() => handleUpgrade(key)}
                disabled={isPremium || checkoutLoading === planId}
                className={`w-full rounded-2xl py-3 text-sm font-semibold transition-colors mb-5 ${
                  isPremium
                    ? 'bg-muted text-muted-foreground cursor-default'
                    : isPro
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {checkoutLoading === planId ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : isPremium ? (
                  profile?.subscription_plan?.startsWith(key) ? 'Current Plan' : 'Included'
                ) : (
                  `Get ${plan.name}`
                )}
              </button>

              <div className="space-y-3 flex-1">
                {plan.features.map((f, idx) => {
                  const FeatureIcon = f.icon;
                  return (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FeatureIcon className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-xs text-foreground/80">{f.label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Redeem code */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Have a code?</h3>
          </div>
          {redeemSuccess ? (
            <div className="text-center py-3">
              <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-2">
                <Check className="w-5 h-5 text-success" />
              </div>
              <p className="text-sm font-medium text-foreground">Premium unlocked! Redirecting...</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={redeemCode}
                onChange={e => setRedeemCode(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && redeemCode) handleRedeem(); }}
                placeholder="Enter your code"
                className="flex-1 bg-surface-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleRedeem}
                disabled={!redeemCode || redeemLoading}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {redeemLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
              </button>
            </div>
          )}
          {redeemError && <p className="text-xs text-danger mt-2">{redeemError}</p>}
        </div>

      <div className="flex items-center justify-center gap-6 mt-6">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" /> Secure payment
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="w-3.5 h-3.5 text-success" /> Cancel anytime
        </div>
      </div>
    </div>
  );
}