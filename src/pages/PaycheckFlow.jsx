import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getFinancialContext, buildContextString, buildNudgeSystemPrompt, formatCurrency } from '@/lib/nudgeUtils';
import { checkFeatureAccess, spendCredits } from '@/lib/useCredits';
import PaywallCard from '@/components/PaywallCard';
import StorySlide from '@/components/paycheck/StorySlide';
import { ArrowLeft, Lock, Zap, Loader2, ChevronDown, Sparkles, Target } from 'lucide-react';

const CATEGORY_COLORS = {
  Rent: '#6366F1',
  Food: '#EC4899',
  Shopping: '#10B981',
  Transport: '#06B6D4',
  Bills: '#EF4444',
  Subscriptions: '#8B5CF6',
  Entertainment: '#F59E0B',
  Health: '#14B8A6',
  Other: '#64748B',
};

const PERSONALITIES = [
  { rate: 25, key: 'saver', label: 'The Saver', emoji: '🛡️', desc: 'You keep more than you spend. Your future self is smiling.' },
  { rate: 15, key: 'balanced', label: 'Balanced Planner', emoji: '⚖️', desc: 'You spend with intention and save steadily. Solid balance.' },
  { rate: 5, key: 'growth', label: 'Growth Builder', emoji: '🌱', desc: "You're building momentum. A bit more saving could accelerate your goals." },
  { rate: -100, key: 'impulse', label: 'Impulse Spender', emoji: '⚡', desc: 'Money flows out fast. Let\'s find ways to slow it down together.' },
];

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [target, duration]);
  return value;
}

function detectIncomeCycle(ctx) {
  const { bankTransactions, profile } = ctx;

  if (bankTransactions && bankTransactions.length > 0) {
    const incomeTxns = bankTransactions.filter(t =>
      t.recurring_type === 'income' ||
      (t.amount > 0 && /payroll|salary|deposit|paycheck|direct deposit/i.test(t.name || t.merchant_name || ''))
    );
    if (incomeTxns.length > 0) {
      const latest = incomeTxns[0];
      const cycleStart = new Date(latest.date);
      const cycleEnd = new Date(cycleStart);
      cycleEnd.setDate(cycleEnd.getDate() + 30);
      return {
        id: `cycle_${latest.date}_${Math.round(latest.amount)}`,
        amount: latest.amount,
        date: latest.date,
        cycleStart: cycleStart.toISOString(),
        cycleEnd: cycleEnd.toISOString(),
        source: 'plaid',
      };
    }
  }

  const now = new Date();
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    id: `cycle_${cycleStart.toISOString().split('T')[0]}`,
    amount: profile.monthly_income || 0,
    date: cycleStart.toISOString(),
    cycleStart: cycleStart.toISOString(),
    cycleEnd: cycleEnd.toISOString(),
    source: 'profile',
  };
}

function mapCategory(category) {
  const map = {
    dining: 'Food', groceries: 'Food', shopping: 'Shopping', entertainment: 'Entertainment',
    transport: 'Transport', bills: 'Bills', health: 'Health', travel: 'Transport',
    tech: 'Shopping', other: 'Other', rent: 'Rent', utilities: 'Bills',
    phone: 'Bills', insurance: 'Bills', internet: 'Bills',
  };
  return map[category] || 'Other';
}

function mapBankCategory(category) {
  if (!category) return 'Other';
  const cat = category.toLowerCase();
  if (/food|drink|restaurant|dining|grocery/.test(cat)) return 'Food';
  if (/shop|store|market|retail/.test(cat)) return 'Shopping';
  if (/travel|transport|gas|fuel|uber|lyft/.test(cat)) return 'Transport';
  if (/payment|bill|utility|electric|water|gas/.test(cat)) return 'Bills';
  if (/subscription|recurring|netflix|spotify/.test(cat)) return 'Subscriptions';
  if (/entertain|movie|game/.test(cat)) return 'Entertainment';
  if (/health|medical|pharmacy/.test(cat)) return 'Health';
  return 'Other';
}

function analyzeSpending(ctx, cycle) {
  const { purchases, bills, subscriptions, bankTransactions } = ctx;
  const cycleStart = new Date(cycle.cycleStart);
  const cycleEnd = new Date(cycle.cycleEnd);
  const categories = {};
  let totalSpent = 0;

  purchases.forEach(p => {
    const d = new Date(p.purchase_date || p.date || p.created_date);
    if (d >= cycleStart && d < cycleEnd) {
      const cat = mapCategory(p.category);
      categories[cat] = (categories[cat] || 0) + (p.amount || 0);
      totalSpent += p.amount || 0;
    }
  });

  if (bankTransactions && bankTransactions.length > 0) {
    bankTransactions.forEach(t => {
      const d = new Date(t.date);
      if (d >= cycleStart && d < cycleEnd && t.amount < 0 && t.recurring_type !== 'income') {
        const cat = mapBankCategory(t.category);
        categories[cat] = (categories[cat] || 0) + Math.abs(t.amount);
        totalSpent += Math.abs(t.amount);
      }
    });
  }

  const subTotal = (subscriptions || []).reduce((s, sub) => s + (sub.monthly_cost || 0), 0);
  if (subTotal > 0) { categories['Subscriptions'] = (categories['Subscriptions'] || 0) + subTotal; totalSpent += subTotal; }

  const billTotal = (bills || []).reduce((s, b) => s + (b.amount || 0), 0);
  if (billTotal > 0) { categories['Bills'] = (categories['Bills'] || 0) + billTotal; totalSpent += billTotal; }

  const savings = (cycle.amount || 0) - totalSpent;
  const savingsRate = cycle.amount > 0 ? Math.round((savings / cycle.amount) * 100) : 0;

  const breakdown = Object.entries(categories)
    .map(([label, amount]) => ({
      label,
      amount: Math.round(amount),
      percent: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      color: CATEGORY_COLORS[label] || CATEGORY_COLORS.Other,
    }))
    .sort((a, b) => b.amount - a.amount);

  return { breakdown, totalSpent: Math.round(totalSpent), savings: Math.round(savings), savingsRate, income: Math.round(cycle.amount || 0) };
}

function determinePersonality(breakdown) {
  for (const p of PERSONALITIES) {
    if (breakdown.savingsRate >= p.rate) return p;
  }
  return PERSONALITIES[PERSONALITIES.length - 1];
}

export default function PaycheckFlow() {
  const [state, setState] = useState('loading');
  const [lockReason, setLockReason] = useState(null);
  const [lockData, setLockData] = useState(null);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      const ctx = await getFinancialContext();
      const cycle = detectIncomeCycle(ctx);

      if (!cycle.amount || cycle.amount <= 0) {
        setState('no_data');
        return;
      }

      const access = await checkFeatureAccess('paycheck_wrapped', cycle.id);

      if (!access.canUse) {
        setLockReason(access.reason);
        setLockData({ cost: access.cost, balance: access.balance, plan: access.plan });
        setState('locked');
        return;
      }

      const breakdown = analyzeSpending(ctx, cycle);
      const personality = determinePersonality(breakdown);

      let insight = '';
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: buildNudgeSystemPrompt(buildContextString(ctx), {
            extraRules: `Generate a brief paycheck insight for ${ctx.profile.first_name} (3-4 short sentences). Compare this cycle's spending to typical patterns. Note any anomalies, improvements, or warnings. Be encouraging, never shaming. Return just the text, no quotes.

Spending breakdown: ${breakdown.breakdown.map(b => `${b.label}: $${b.amount} (${b.percent}%)`).join(', ')}.
Total spent: $${breakdown.totalSpent}. Savings: $${breakdown.savings}. Savings rate: ${breakdown.savingsRate}%.`,
          }),
        });
        insight = typeof response === 'string' ? response : '';
      } catch {}

      await spendCredits('paycheck_wrapped', cycle.id);

      const goalContribution = breakdown.savings > 0 ? breakdown.savings : 0;
      const primaryGoal = ctx.primaryGoal;
      const goalPct = primaryGoal ? Math.round((goalContribution / primaryGoal.target_amount) * 100) : 0;
      const remaining = primaryGoal ? primaryGoal.target_amount - primaryGoal.current_amount : 0;
      const daysToGoal = primaryGoal && goalContribution > 0 ? Math.ceil(remaining / goalContribution) * 30 : null;

      setData({ cycle, breakdown, personality, insight, profile: ctx.profile, primaryGoal, goalContribution, goalPct, daysToGoal });
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Preparing your Paycheck Wrapped...</p>
      </div>
    );
  }

  if (state === 'no_data') {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto min-h-screen flex flex-col justify-center">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <div className="text-center py-20">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No income data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Connect your bank account or set your monthly income to unlock Paycheck Wrapped.</p>
          <Link to="/connected-accounts" className="inline-block mt-4 text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/15 transition-colors">
            Connect bank
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'locked') {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto min-h-screen flex flex-col justify-center">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          {lockReason === 'plan_locked' && (
            <>
              <div className="w-16 h-16 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold mb-2">Paycheck Wrapped is a Plus feature</h2>
              <p className="text-sm text-muted-foreground mb-6">See exactly where every dollar of your paycheck goes — as an animated story you can scroll through.</p>
              <PaywallCard title="Unlock Paycheck Wrapped" description="Watch your paycheck come to life with a personalized spending story every cycle." trialDays={0} onUpgrade={() => {}} />
            </>
          )}
          {lockReason === 'insufficient_credits' && (
            <>
              <div className="w-16 h-16 rounded-3xl bg-warning/15 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-warning" />
              </div>
              <h2 className="text-lg font-bold mb-2">Out of credits</h2>
              <p className="text-sm text-muted-foreground mb-4">You need {lockData?.cost} credits for Paycheck Wrapped but have {lockData?.balance}. Upgrade your plan for more credits.</p>
              <Link to="/pricing" className="inline-block text-sm font-semibold text-primary-foreground bg-primary px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
                Get more credits
              </Link>
            </>
          )}
          {lockReason === 'already_viewed_cycle' && (
            <>
              <div className="w-16 h-16 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold mb-2">Already viewed this cycle</h2>
              <p className="text-sm text-muted-foreground mb-6">You already viewed your Paycheck Wrapped for this income cycle. It will unlock again after your next paycheck.</p>
              <Link to="/insights" className="inline-block text-sm font-semibold text-primary bg-primary/10 px-6 py-3 rounded-xl hover:bg-primary/15 transition-colors">
                Back to Insights
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  if (state === 'error' || !data) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto min-h-screen flex flex-col justify-center">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <p className="text-sm text-muted-foreground text-center">Something went wrong. Try again later.</p>
      </div>
    );
  }

  const { cycle, breakdown, personality, insight, profile, primaryGoal, goalContribution, goalPct, daysToGoal } = data;
  const largest = breakdown.breakdown[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Floating back button */}
      <Link
        to="/insights"
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </Link>

      {/* Slide 1: Arrival */}
      <StorySlide className="bg-gradient-to-b from-primary/5 to-background">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-4xl">💵</span>
          </motion.div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-3">Your paycheck arrived</p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold font-heading text-primary mb-2"
          >
            <CountUp target={cycle.amount} />
          </motion.p>
          <p className="text-sm text-muted-foreground">
            {cycle.source === 'plaid' ? 'Detected from your bank' : 'Based on your monthly income'}
          </p>
        </div>
        <ScrollHint />
      </StorySlide>

      {/* Slide 2: Largest expense */}
      {largest && (
        <StorySlide>
          <div className="text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-4">Your biggest spend</p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${largest.color}20` }}
            >
              <span className="text-3xl">{categoryEmoji(largest.label)}</span>
            </motion.div>
            <p className="text-4xl font-bold font-heading mb-2" style={{ color: largest.color }}>
              {formatCurrency(largest.amount)}
            </p>
            <p className="text-lg font-semibold text-foreground">{largest.label}</p>
            <p className="text-sm text-muted-foreground mt-1">{largest.percent}% of your spending</p>
          </div>
          <ScrollHint />
        </StorySlide>
      )}

      {/* Slide 3: Breakdown */}
      <StorySlide>
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-6 text-center">Where it all went</p>
          <div className="space-y-3">
            {breakdown.breakdown.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-border bg-card overflow-hidden h-12"
              >
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${cat.percent}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.6 }}
                  className="absolute inset-y-0 left-0 rounded-2xl"
                  style={{ backgroundColor: cat.color, opacity: 0.25 }}
                />
                <div className="relative h-full flex items-center justify-between px-4">
                  <span className="text-sm font-medium">{categoryEmoji(cat.label)} {cat.label}</span>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(cat.amount)}</span>
                </div>
              </motion.div>
            ))}
          </div>
          {breakdown.breakdown.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No spending recorded this cycle yet.</p>
          )}
        </div>
        <ScrollHint />
      </StorySlide>

      {/* Slide 4: AI Insight */}
      {insight && (
        <StorySlide className="bg-gradient-to-b from-violet-500/5 to-background">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-16 h-16 rounded-3xl bg-violet-500/15 flex items-center justify-center mx-auto mb-6"
            >
              <Sparkles className="w-8 h-8 text-violet-500" />
            </motion.div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-4">What I noticed</p>
            <p className="text-base text-foreground/90 leading-relaxed">{insight}</p>
          </div>
          <ScrollHint />
        </StorySlide>
      )}

      {/* Slide 5: Financial Personality */}
      <StorySlide>
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="text-7xl mb-6"
          >
            {personality.emoji}
          </motion.div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Your financial personality</p>
          <h2 className="text-3xl font-bold font-heading mb-4">{personality.label}</h2>
          <p className="text-sm text-foreground/80 leading-relaxed">{personality.desc}</p>
        </div>
        <ScrollHint />
      </StorySlide>

      {/* Slide 6: Final Summary */}
      <StorySlide className="bg-gradient-to-b from-primary/5 to-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-6">The bottom line</p>

          {/* Savings rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <p className="text-xs text-muted-foreground mb-1">Savings rate</p>
            <p className={`text-5xl font-bold font-heading ${breakdown.savingsRate >= 15 ? 'text-success' : breakdown.savingsRate >= 5 ? 'text-warning' : 'text-danger'}`}>
              {breakdown.savingsRate}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You kept <CountUp target={breakdown.savings} /> of {formatCurrency(cycle.amount)}
            </p>
          </motion.div>

          {/* Goal impact */}
          {primaryGoal && goalContribution > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-card p-4 mb-4"
            >
              <div className="flex items-center gap-2 justify-center mb-2">
                <Target className="w-4 h-4 text-primary" />
                <p className="text-xs font-medium text-muted-foreground uppercase">Goal impact</p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                +{formatCurrency(goalContribution)} toward {primaryGoal.name}
              </p>
              {daysToGoal && (
                <p className="text-xs text-muted-foreground mt-1">
                  {goalPct}% of goal · ~{daysToGoal} days to completion at this rate
                </p>
              )}
            </motion.div>
          )}

          {/* Buttons */}
          <div className="space-y-2 mt-8">
            <Link
              to="/insights"
              className="block w-full p-4 rounded-2xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Done
            </Link>
            <Link
              to="/insights/financial-twin"
              className="block w-full p-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              Explore your Financial Twin →
            </Link>
          </div>
        </div>
      </StorySlide>
    </div>
  );
}

function CountUp({ target }) {
  const value = useCountUp(target);
  return <>{formatCurrency(value)}</>;
}

function ScrollHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground"
    >
      <span className="text-[10px] uppercase tracking-wide">Scroll</span>
      <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        <ChevronDown className="w-4 h-4" />
      </motion.div>
    </motion.div>
  );
}

function categoryEmoji(label) {
  const map = {
    Rent: '🏠', Food: '🍔', Shopping: '🛍️', Transport: '🚗',
    Bills: '📄', Subscriptions: '📺', Entertainment: '🎬',
    Health: '💊', Other: '📦',
  };
  return map[label] || '📦';
}