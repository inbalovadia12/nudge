import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/nudgeUtils';
import { getFinancialContext, buildContextString, buildNudgeSystemPrompt } from '@/lib/nudgeUtils';
import { ArrowLeft, Heart, Loader2, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

export default function FinancialHealth() {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [scores, setScores] = useState(null);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const ctx = await getFinancialContext();
      const income = ctx.profile?.monthly_income || 0;
      const totalSpent = ctx.totalSpent || 0;
      const balance = ctx.balance || 0;
      const goal = ctx.primaryGoal;

      // Calculate component scores
      const savingsConsistency = goal && goal.target_amount > 0
        ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
        : balance > 0 ? 50 : 20;

      const goalProgress = savingsConsistency;

      const impulseControl = income > 0
        ? Math.max(0, Math.min(100, 100 - Math.round((totalSpent / income) * 100)))
        : 50;

      let subscriptionRatio = 80;
      try {
        const subs = await base44.entities.Subscription.filter({ status: 'active' });
        const subTotal = subs.reduce((s, x) => s + (x.monthly_cost || 0), 0);
        if (income > 0) {
          subscriptionRatio = Math.max(0, Math.min(100, 100 - Math.round((subTotal / income) * 100 * 3)));
        }
      } catch {}

      let billTiming = 70;
      try {
        const bills = await base44.entities.Bill.filter({ status: 'upcoming' });
        billTiming = bills.some(b => b.predicted_balance_after < 0) ? 35 : 75;
      } catch {}

      const emergencyFund = goal && goal.name?.toLowerCase().includes('emergency')
        ? savingsConsistency
        : Math.min(100, Math.round((balance / (income * 3)) * 100));

      const overall = Math.round(
        (savingsConsistency + goalProgress + impulseControl + subscriptionRatio + billTiming + emergencyFund) / 6
      );

      // AI summary
      let aiSummary = '';
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: buildNudgeSystemPrompt(buildContextString(ctx), {
            extraRules: `Based on this health score breakdown, give ONE encouraging observation (2 sentences max). Never shame. Focus on what's going well and one area to watch.

Scores (0-100): Savings consistency: ${savingsConsistency}, Goal progress: ${goalProgress}, Impulse control: ${impulseControl}, Subscription ratio: ${subscriptionRatio}, Bill timing: ${billTiming}, Emergency fund: ${emergencyFund}. Overall: ${overall}.

Return just the observation text.`
          }),
        });
        aiSummary = response;
      } catch {}

      setScores({
        overall,
        components: { savingsConsistency, goalProgress, impulseControl, subscriptionRatio, billTiming, emergencyFund },
        aiSummary,
      });
    } catch {}
    setAnalyzing(false);
    setLoading(false);
  };

  useEffect(() => {
    analyze();
  }, []);

  if (loading || analyzing) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Calculating your financial health...</p>
        </div>
      </div>
    );
  }

  if (!scores) return null;

  const radarData = [
    { name: 'Savings', value: scores.components.savingsConsistency },
    { name: 'Goals', value: scores.components.goalProgress },
    { name: 'Impulse', value: scores.components.impulseControl },
    { name: 'Subs', value: scores.components.subscriptionRatio },
    { name: 'Bills', value: scores.components.billTiming },
    { name: 'Emergency', value: scores.components.emergencyFund },
  ];

  const scoreColor = scores.overall >= 70 ? 'text-success' : scores.overall >= 50 ? 'text-warning' : 'text-danger';
  const ringColor = scores.overall >= 70 ? 'hsl(var(--success))' : scores.overall >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--danger))';

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (scores.overall / 100) * circumference;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>
      <div className="flex items-center gap-2 mb-1">
        <Heart className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold font-heading">Financial Health</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">A holistic view of how you're doing with money.</p>

      {/* Overall score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-border bg-card p-6 mb-6"
      >
        <div className="flex items-center gap-6">
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <motion.circle
                cx="70" cy="70" r={radius} fill="none"
                stroke={ringColor}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold font-heading ${scoreColor}`}>{scores.overall}</span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overall</span>
            </div>
            {scores.aiSummary && (
              <p className="text-sm text-foreground/80 leading-relaxed">{scores.aiSummary}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Radar chart */}
      <div className="rounded-3xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">Component breakdown</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual scores */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Savings', value: scores.components.savingsConsistency },
          { label: 'Goals', value: scores.components.goalProgress },
          { label: 'Impulse Control', value: scores.components.impulseControl },
          { label: 'Subscriptions', value: scores.components.subscriptionRatio },
          { label: 'Bill Timing', value: scores.components.billTiming },
          { label: 'Emergency Fund', value: scores.components.emergencyFund },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{item.label}</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-bold ${item.value >= 70 ? 'text-success' : item.value >= 50 ? 'text-warning' : 'text-danger'}`}>{item.value}</span>
              <span className="text-[10px] text-muted-foreground">/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                className={`h-full rounded-full ${item.value >= 70 ? 'bg-success' : item.value >= 50 ? 'bg-warning' : 'bg-danger'}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}