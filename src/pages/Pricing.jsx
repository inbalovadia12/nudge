import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { usePremiumStatus } from '@/lib/usePremium';
import { ArrowLeft, Check, Crown, Sparkles, Loader2, Zap, Shield } from 'lucide-react';

const plans = [
  {
    id: 'plus_monthly',
    name: 'Plus',
    price: 4.99,
    period: 'month',
    description: 'All premium features, billed monthly',
    badge: null,
    features: [
      'Shopping Shield with app blocker',
      'Subscription tracker & cleanup',
      'Spending heatmap',
      'Paycheck flow visualization',
      'Deal alerts & price tracking',
      'Money leak detector',
      'Financial Health Score',
      'AI financial assistant',
    ],
  },
  {
    id: 'pro_annual',
    name: 'Pro',
    price: 39.99,
    period: 'year',
    description: 'All premium features, billed yearly',
    badge: 'Best Value — Save 33%',
    features: [
      'Everything in Plus',
      'Financial Twin AI simulation',
      'Spending simulator',
      'Regret tracker',
      'AI personality profile',
      'Future Feed predictions',
      'Priority AI responses',
      'Early access to new features',
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { isPremium, profile, loading } = usePremiumStatus();
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  async function handleUpgrade(planId) {
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

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full mb-4">
          <Sparkles className="w-3 h-3" /> Nudge Premium
        </div>
        <h1 className="text-3xl font-bold font-heading mb-2">Choose your plan</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Unlock all premium insights and tools to transform your spending habits.</p>
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
              You're on the {profile?.subscription_plan === 'pro_annual' ? 'Pro Annual' : 'Plus Monthly'} plan
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
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-3xl border-2 p-6 relative flex flex-col ${plan.badge ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap">
                {plan.badge}
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              {plan.name === 'Pro' ? <Crown className="w-5 h-5 text-primary" /> : <Zap className="w-5 h-5 text-primary" />}
              <h3 className="text-lg font-bold">{plan.name}</h3>
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-sm text-muted-foreground">/{plan.period}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">{plan.description}</p>

            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={isPremium || checkoutLoading === plan.id}
              className={`w-full rounded-2xl py-3 text-sm font-semibold transition-colors mb-5 ${
                isPremium
                  ? 'bg-muted text-muted-foreground cursor-default'
                  : plan.badge
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {checkoutLoading === plan.id ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : isPremium ? (
                profile?.subscription_plan === plan.id ? 'Current Plan' : 'Included'
              ) : (
                `Get ${plan.name}`
              )}
            </button>

            <div className="space-y-2.5 flex-1">
              {plan.features.map((f, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <span className="text-xs text-foreground/80">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust signals */}
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