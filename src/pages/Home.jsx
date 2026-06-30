import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import SavingsRing from '@/components/SavingsRing';
import PurchaseItem from '@/components/PurchaseItem';
import NudgeCard from '@/components/NudgeCard';
import { getGreeting, formatCurrency, formatDateLong, getFinancialContext, buildContextString, buildNudgeSystemPrompt } from '@/lib/nudgeUtils';
import { spendCredits } from '@/lib/useCredits';
import { ScanSearch, ArrowRight, Target, TrendingDown, Wallet, CalendarClock, Shield, Sparkles, ArrowUpRight, Receipt, Zap } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [primaryGoal, setPrimaryGoal] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [ctx, setCtx] = useState(null);
  const [nudge, setNudge] = useState('');
  const [nudgeLoading, setNudgeLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const finCtx = await getFinancialContext();
        if (!finCtx.profile?.onboarding_complete) {
          navigate('/onboarding');
          return;
        }
        setProfile(finCtx.profile);
        setPrimaryGoal(finCtx.primaryGoal);
        setPurchases(finCtx.purchases.slice(0, 5));
        setCtx(finCtx);
        setLoading(false);

        // ─── 24h cache: only generate nudge once per day, charge 1 credit ───
        try {
          const usageRecords = await base44.entities.FeatureUsage.filter({
            feature_name: 'daily_nudge',
          });
          const lastNudge = usageRecords.sort((a, b) =>
            new Date(b.created_date) - new Date(a.created_date)
          )[0];

          const now = Date.now();
          const CACHE_MS = 24 * 60 * 60 * 1000;

          if (lastNudge && (now - new Date(lastNudge.last_generated_at || lastNudge.created_date).getTime() < CACHE_MS)) {
            // Use cached nudge — no AI call, no credit charge
            setNudge(lastNudge.generated_data_hash || 'Check back tomorrow for a fresh insight.');
            setNudgeLoading(false);
            return;
          }

          // Spend 1 credit for fresh nudge via backend gateway
          const spend = await spendCredits('assistant_message');
          if (!spend.success) {
            // No credits — skip nudge silently
            setNudge(null);
            setNudgeLoading(false);
            return;
          }

          const response = await base44.integrations.Core.InvokeLLM({
            prompt: buildNudgeSystemPrompt(buildContextString(finCtx), {
              extraRules: `Based on the user's financial data, give ONE short, encouraging observation (max 2 sentences). Never negative or guilt-inducing. Be specific with numbers from their actual data. Return just the observation text, nothing else. No quotes.`
            }),
          });
          const nudgeText = typeof response === 'string' ? response : String(response);
          setNudge(nudgeText);

          // Cache the nudge for 24h
          await base44.entities.FeatureUsage.create({
            feature_name: 'daily_nudge',
            cooldown_period: '24h',
            last_generated_at: new Date().toISOString(),
            generated_data_hash: nudgeText,
          });
        } catch {
          setNudge('You\'re here. That\'s a good start — checking in on your goals is the hardest part.');
        }
        setNudgeLoading(false);
      } catch (err) {
        setLoading(false);
        setNudgeLoading(false);
      }
    }
    load();
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      const finCtx = await getFinancialContext();
      if (finCtx.profile) {
        setProfile(finCtx.profile);
        setPrimaryGoal(finCtx.primaryGoal);
        setPurchases(finCtx.purchases.slice(0, 5));
        setCtx(finCtx);
      }
    } catch {}
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const progress = primaryGoal ? Math.round((primaryGoal.current_amount / primaryGoal.target_amount) * 100) : 0;
  const greeting = getGreeting(profile?.first_name || 'there');
  const monthlyIncome = profile?.monthly_income || 0;
  const totalSpent = ctx?.totalSpent || 0;
  const balance = ctx?.balance || 0;
  const spentPct = monthlyIncome > 0 ? Math.min(100, Math.round((totalSpent / monthlyIncome) * 100)) : 0;
  const isHealthy = balance >= 0 && spentPct < 80;
  const healthGradient = isHealthy
    ? 'bg-gradient-to-br from-emerald-500/[0.06] to-transparent'
    : 'bg-gradient-to-br from-rose-500/[0.06] to-transparent';
  const healthText = isHealthy ? 'text-emerald-400' : 'text-rose-400';

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysUntilPayday = daysInMonth - now.getDate();

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-10">
      {/* Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{greeting}.</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Here's a snapshot of your financial world today.</p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-6">

        {/* Financial Health / Spending Summary — large card */}
        {monthlyIncome > 0 && (
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="md:col-span-8 relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-2 p-6 group"
          >
            <div className={`absolute inset-0 ${healthGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">This Month</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {balance >= 0 ? "You're on track" : 'Overspending alert'}
                  </p>
                </div>
                {daysUntilPayday > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-3/60 rounded-full px-3 py-1">
                    <CalendarClock className="w-3.5 h-3.5" />
                    {daysUntilPayday}d to payday
                  </span>
                )}
              </div>

              <div className="flex items-end gap-3 mb-6">
                <span className={`text-3xl sm:text-4xl font-bold ${healthText}`}>{formatCurrency(balance)}</span>
                <span className="text-sm text-muted-foreground mb-1.5">remaining</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-emerald-500/[0.08] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Income</p>
                  <p className="text-sm sm:text-base font-semibold text-foreground">{formatCurrency(monthlyIncome)}</p>
                </div>
                <div className="rounded-xl bg-orange-500/[0.08] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Spent</p>
                  <p className="text-sm sm:text-base font-semibold text-foreground">{formatCurrency(totalSpent)}</p>
                </div>
                <div className={`rounded-xl px-3 py-2 ${balance >= 0 ? 'bg-emerald-500/[0.08]' : 'bg-rose-500/[0.08]'}`}>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Left</p>
                  <p className={`text-sm sm:text-base font-semibold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(balance)}</p>
                </div>
              </div>

              <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPct}%` }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className={`h-full rounded-full bg-gradient-to-r ${spentPct > 80 ? 'from-orange-500 to-rose-500' : 'from-primary to-emerald-400'}`}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{spentPct}% of income spent</p>
            </div>
          </motion.div>
        )}

        {/* Savings Goal Ring — medium card */}
        {primaryGoal ? (
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="md:col-span-4 relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-2 p-6 flex flex-col items-center justify-center"
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-violet-500/[0.06] blur-3xl" />
            <SavingsRing progress={progress} size={140} strokeWidth={11} sublabel="there" />
            <h2 className="text-base font-semibold text-foreground mt-4 text-center">{primaryGoal.name}</h2>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {formatCurrency(primaryGoal.current_amount)} of {formatCurrency(primaryGoal.target_amount)}
            </p>
            {primaryGoal.estimated_completion_date && (
              <p className="text-xs text-primary mt-2 text-center">
                {progress > 0 ? `On track for ${formatDateLong(primaryGoal.estimated_completion_date)}` : 'Just getting started'}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="md:col-span-4 rounded-2xl border border-dashed border-white/[0.08] bg-surface-2/50 p-6 flex flex-col items-center justify-center text-center"
          >
            <Target className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">Set a savings goal</p>
            <p className="text-xs text-muted-foreground mt-1">Give your money a purpose</p>
            <Link to="/goals" className="mt-3 text-xs text-primary hover:underline">Get started →</Link>
          </motion.div>
        )}

        {/* Quick Actions row */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="md:col-span-12 grid grid-cols-3 gap-3"
        >
          <Link
            to="/shield"
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-2 p-4 hover:border-primary/30 transition-all duration-300"
          >
            <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Spending Guard</p>
              <p className="text-xs text-muted-foreground mt-0.5">Block & intercept</p>
            </div>
          </Link>
          <Link
            to="/check"
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-2 p-4 hover:border-violet-500/30 transition-all duration-300"
          >
            <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-violet-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center mb-3">
                <ScanSearch className="w-5 h-5 text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">Ask Before You Buy</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get a verdict first</p>
            </div>
          </Link>
          <Link
            to="/goals"
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-2 p-4 hover:border-emerald-500/30 transition-all duration-300"
          >
            <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">My Goals</p>
              <p className="text-xs text-muted-foreground mt-0.5">Track savings</p>
            </div>
          </Link>
        </motion.div>

        {/* Recent Purchases — 6 cols */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="md:col-span-7 rounded-2xl border border-white/[0.06] bg-surface-2 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
            </div>
            <Link to="/transactions" className="text-xs text-primary hover:underline flex items-center gap-1">
              See All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {purchases.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {purchases.map(p => <PurchaseItem key={p.id} purchase={p} />)}
            </div>
          ) : (
            <div className="py-8 text-center">
              <TrendingDown className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No purchases yet — they'll show up here once you log them.</p>
            </div>
          )}
        </motion.div>

        {/* Daily Guidance / Nudge — 5 cols */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="md:col-span-5"
        >
          <NudgeCard message={nudge} loading={nudgeLoading} />
        </motion.div>
      </div>

      {/* AI Advisor banner — full width */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-4 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-primary/[0.08] via-violet-500/[0.04] to-transparent p-5 relative overflow-hidden"
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-violet-500/[0.08] blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-0.5">Your AI Financial Advisor</p>
            <p className="text-sm text-foreground/80 leading-relaxed">Personal financial guidance that used to cost $200/hr — now in your pocket.</p>
          </div>
          <Link to="/assistant" className="flex-shrink-0 hidden sm:flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 rounded-full px-4 py-2 hover:bg-primary/20 transition-colors">
            <Zap className="w-3.5 h-3.5" /> Ask
          </Link>
        </div>
      </motion.div>
    </div>
    </PullToRefresh>
  );
}