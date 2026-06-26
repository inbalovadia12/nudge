import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/nudgeUtils';
import { Sparkles } from 'lucide-react';
import { usePremiumStatus } from '@/lib/usePremium';
import HealthScoreRing from '@/components/HealthScoreRing';
import HabitCard from '@/components/HabitCard';
import BillItem from '@/components/BillItem';
import DataMaturityBar from '@/components/DataMaturityBar';
import PaywallScreen from '@/components/PaywallScreen';
import { Wallet, CalendarDays, TrendingUp, User, Tag, ChevronRight, AlertTriangle, Heart, Brain, Calendar, Droplets, Crown, Calculator, Search } from 'lucide-react';

export default function Insights() {
  const { isPremium, profile, loading } = usePremiumStatus();
  const [showPaywall, setShowPaywall] = useState(false);
  const [healthScore, setHealthScore] = useState(null);
  const [habits, setHabits] = useState([]);
  const [bills, setBills] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [subCount, setSubCount] = useState(0);

  useEffect(() => {
    Promise.all([
      base44.entities.HealthScore.list('-last_updated', 1),
      base44.entities.SpendingHabit.list('-detected_date', 10),
      base44.entities.Bill.filter({ status: 'upcoming' }),
      base44.entities.Subscription.filter({ status: 'active' }),
    ]).then(([scores, h, b, subs]) => {
      setHealthScore(scores[0]);
      setHabits(h);
      setBills(b.sort((a, c) => new Date(a.due_date) - new Date(c.due_date)));
      const total = subs.reduce((s, sub) => s + (sub.monthly_cost || 0), 0);
      setSubTotal(total);
      setSubCount(subs.length);
    }).catch(() => {});
  }, []);

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const trialDays = profile?.premium_trial_end_date
    ? Math.max(0, Math.ceil((new Date(profile.premium_trial_end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const freeHabits = habits.filter(h => !h.is_premium_insight).slice(0, 2);
  const premiumHabits = habits.filter(h => h.is_premium_insight);
  const upcomingBills = bills.slice(0, 5);
  const totalBills = bills.reduce((s, b) => s + (b.amount || 0), 0);

  const premiumNavItems = [
    { label: 'Financial Health', desc: 'Your holistic money score', path: '/insights/health', icon: Heart },
    { label: 'Financial Twin', desc: 'Ask "what if" — get projections', path: '/insights/financial-twin', icon: Brain },
    { label: 'Future Feed', desc: 'Upcoming financial events', path: '/insights/future-feed', icon: Calendar },
    { label: 'Money Leaks', desc: 'Small drips adding up', path: '/insights/money-leaks', icon: Droplets },
    { label: 'Paycheck Flow', desc: 'Watch where every dollar goes', path: '/insights/paycheck', icon: Wallet },
    { label: 'Spending Heatmap', desc: 'See your patterns spatially', path: '/insights/heatmap', icon: CalendarDays },
    { label: 'Simulator', desc: 'What if you changed one thing?', path: '/insights/simulator', icon: TrendingUp },
    { label: 'Personality', desc: 'Your spending type, from data', path: '/insights/personality', icon: User },
    { label: 'Deal Center', desc: 'Price alerts that matter', path: '/insights/deals', icon: Tag },
    { label: 'Smart Calculators', desc: 'Savings growth & split payments', path: '/insights/calculators', icon: Calculator },
    { label: 'AI Deal Finder', desc: 'Best deals across retailers', path: '/insights/deal-finder', icon: Search },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading">Insights</h1>
        <div className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3" /> Beta
        </div>
      </div>

      {/* Data maturity */}
      <div className="mb-6">
        <DataMaturityBar weeksIn={3} label="Thryve is learning your patterns. Habits and heatmap will fill in over the coming weeks." />
      </div>

      {/* Health score */}
      {healthScore && (
        <div className="mb-6">
          <HealthScoreRing score={healthScore.score} change={healthScore.change} primaryReason={healthScore.primary_reason} />
        </div>
      )}

      {/* Free: Subscription summary */}
      <div className="mb-6">
        <Link to="/insights/subscriptions" className="block">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-3xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">MONTHLY SUBSCRIPTIONS</p>
                <p className="text-3xl font-bold font-heading text-foreground">{formatCurrency(subTotal)}</p>
                <p className="text-sm text-muted-foreground mt-1">{subCount} active subscriptions</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Free: Upcoming bills */}
      <div className="mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Upcoming bills</h2>
            <span className="text-xs text-muted-foreground">{formatCurrency(totalBills)} total</span>
          </div>
          <div className="divide-y divide-border">
            {upcomingBills.map(bill => <BillItem key={bill.id} bill={bill} />)}
          </div>
          {bills.some(b => b.predicted_balance_after < 0) && (
            <div className="mt-4 flex items-center gap-2 text-xs text-danger bg-danger/5 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Your balance may go negative on {new Date(bills.find(b => b.predicted_balance_after < 0).due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
            </div>
          )}
        </div>
      </div>

      {/* Free: Habit detection (top 2) */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3">Patterns I'm noticing</h2>
        <div className="space-y-3">
          {freeHabits.map((habit, i) => <HabitCard key={habit.id} habit={habit} index={i} />)}
          {premiumHabits.map((habit, i) => <HabitCard key={habit.id} habit={habit} index={i + 2} isLocked={!isPremium} />)}
        </div>
      </div>

      {/* Premium features */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3">Premium insights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {premiumNavItems.map((item, i) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={item.path} className="block">
                <div className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-colors h-full">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                    {!isPremium && <span className="ml-auto text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">PRO</span>}
                  </div>
                  <p className="text-xs text-muted-foreground pl-11">{item.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Premium upsell */}
      {!isPremium && (
        <div className="mt-8">
          <button
            onClick={() => setShowPaywall(true)}
            className="w-full rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 text-left hover:bg-primary/10 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Crown className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-foreground mb-0.5">Unlock Advanced Insights</p>
                <p className="text-sm text-muted-foreground">Get spending heatmaps, AI financial twin, unlimited shopping blocks, and more.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </button>
        </div>
      )}

      {/* Full-screen paywall */}
      {showPaywall && (
        <PaywallScreen onClose={() => setShowPaywall(false)} />
      )}
    </div>
  );
}