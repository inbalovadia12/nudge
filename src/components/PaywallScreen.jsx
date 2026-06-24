import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Shield, TrendingUp, Brain, Lock, Sparkles, BarChart3, ArrowRight, X } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Advanced Spending Insights',
    description: 'Spending heatmaps, paycheck flow visualization, money leak detection, and AI-powered habit analysis.',
  },
  {
    icon: Shield,
    title: 'Unlimited Shopping Blocks',
    description: 'Block as many apps and websites as you need, with intercept mode and Screen Time sync.',
  },
  {
    icon: Brain,
    title: 'Financial Twin AI',
    description: 'Simulate "what if" scenarios — see how changes today impact your finances months ahead.',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description: 'Future Feed predictions, deal alerts, price tracking, and your spending personality profile.',
  },
];

export default function PaywallScreen({ title = 'Unlock Premium', onClose }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-10 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Hero section */}
      <div className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative px-6 pt-16 pb-8 text-center max-w-lg mx-auto">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-5"
          >
            <Crown className="w-10 h-10 text-primary" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full mb-4"
          >
            <Sparkles className="w-3 h-3" /> Nudge Premium
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-bold font-heading mb-2"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground leading-relaxed"
          >
            Unlock advanced spending insights, unlimited shopping blocks, and AI-powered tools that transform how you manage money.
          </motion.p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-lg mx-auto px-6 pb-8">
        <div className="space-y-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
              <Check className="w-4 h-4 text-success flex-shrink-0 mt-1" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Plan preview */}
      <div className="max-w-lg mx-auto px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold">Two plans available</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card border border-border p-3 text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Plus</p>
              <p className="text-xl font-bold">$4.99<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
              <p className="text-[10px] text-muted-foreground mt-1">or $39.99/yr</p>
            </div>
            <div className="rounded-2xl bg-card border-2 border-primary p-3 text-center relative">
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap">Best Value</span>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Pro</p>
              <p className="text-xl font-bold">$9.99<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
              <p className="text-[10px] text-muted-foreground mt-1">or $79.99/yr</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <div className="max-w-lg mx-auto px-6 pb-10">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={() => navigate('/pricing')}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-base font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          View Plans <ArrowRight className="w-5 h-5" />
        </motion.button>
        <div className="flex items-center justify-center gap-5 mt-4">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="w-3 h-3" /> Secure payment
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Check className="w-3 h-3 text-success" /> Cancel anytime
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
          >
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
}