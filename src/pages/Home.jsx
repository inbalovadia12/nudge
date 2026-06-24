import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import SavingsRing from '@/components/SavingsRing';
import PurchaseItem from '@/components/PurchaseItem';
import NudgeCard from '@/components/NudgeCard';
import { getGreeting, formatCurrency, formatDateLong, getFinancialContext, buildContextString, buildNudgeSystemPrompt } from '@/lib/nudgeUtils';
import { ScanSearch, ArrowRight, Target, TrendingDown, Wallet, CalendarClock, Shield } from 'lucide-react';

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

        try {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: buildNudgeSystemPrompt(buildContextString(finCtx), {
              extraRules: `Based on the user's financial data, give ONE short, encouraging observation (max 2 sentences). Never negative or guilt-inducing. Be specific with numbers from their actual data. Return just the observation text, nothing else. No quotes.`
            }),
          });
          setNudge(response);
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

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysUntilPayday = daysInMonth - now.getDate();

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-2xl mx-auto pb-24 lg:pb-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{greeting}.</h1>
      </motion.div>

      {/* Spending summary */}
      {monthlyIncome > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">This month</span>
            </div>
            {daysUntilPayday > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CalendarClock className="w-3 h-3" />
                {daysUntilPayday} days to payday
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Income</p>
              <p className="text-sm sm:text-base font-semibold text-foreground">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Spent</p>
              <p className="text-sm sm:text-base font-semibold text-foreground">{formatCurrency(totalSpent)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Left</p>
              <p className={`text-sm sm:text-base font-semibold ${balance >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(balance)}</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spentPct}%` }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={`h-full rounded-full ${spentPct > 80 ? 'bg-danger' : 'bg-primary'}`}
            />
          </div>
        </motion.div>
      )}

      {/* Savings Ring */}
      {primaryGoal ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex flex-col items-center py-6 sm:py-8"
        >
          <SavingsRing progress={progress} size={160} strokeWidth={12} sublabel="there" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mt-4">{primaryGoal.name}</h2>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {formatCurrency(primaryGoal.current_amount)} of {formatCurrency(primaryGoal.target_amount)}
          </p>
          {primaryGoal.estimated_completion_date && (
            <p className="text-sm text-primary mt-2">
              {progress > 0 ? `On track for ${formatDateLong(primaryGoal.estimated_completion_date)}` : 'Just getting started'}
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4"
        >
          <Link to="/goals" className="block rounded-2xl border border-dashed border-border bg-card p-6 text-center hover:border-primary/30 transition-colors">
            <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Set a savings goal</p>
            <p className="text-xs text-muted-foreground mt-1">Give your money a purpose</p>
          </Link>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 mt-4 space-y-3"
      >
        <Link
          to="/shield"
          className="block bg-primary/10 border-2 border-primary/30 rounded-2xl p-5 hover:border-primary/50 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-foreground">Shopping Shield</p>
              <p className="text-sm text-muted-foreground">Block apps, check URLs, and intercept impulse buys</p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
          </div>
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/check"
            className="block bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors group"
          >
            <div className="flex flex-col items-start gap-2">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <ScanSearch className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Check a purchase</p>
                <p className="text-xs text-muted-foreground">Before you buy</p>
              </div>
            </div>
          </Link>
          <Link
            to="/goals"
            className="block bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors group"
          >
            <div className="flex flex-col items-start gap-2">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">My Goals</p>
                <p className="text-xs text-muted-foreground">Track savings</p>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Recent purchases */}
      {purchases.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent</h3>
          <div className="bg-card border border-border rounded-2xl p-2 sm:p-4 divide-y divide-border/50">
            {purchases.map(p => <PurchaseItem key={p.id} purchase={p} />)}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent</h3>
          <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center">
            <TrendingDown className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No purchases yet — they'll show up here once you log them.</p>
          </div>
        </motion.div>
      )}

      {/* Daily nudge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <NudgeCard nudge={nudge} loading={nudgeLoading} />
      </motion.div>
    </div>
  );
}