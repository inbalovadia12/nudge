import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { usePremiumStatus } from '@/lib/usePremium';
import PaywallCard from '@/components/PaywallCard';
import { Trophy, Flame, Check, Zap, Coffee, ShoppingCart, CreditCard, Sparkles } from 'lucide-react';

const challengeTemplates = [
  { title: 'No Spend Weekend', desc: 'Zero non-essential spending Sat & Sun', icon: ShoppingCart, duration: 2, reward: 150, color: 'text-primary' },
  { title: 'Coffee-Free Week', desc: 'Make coffee at home for 7 days', icon: Coffee, duration: 7, reward: 100, color: 'text-warning' },
  { title: 'Subscription Cleanup', desc: 'Cancel 2 unused subscriptions', icon: CreditCard, duration: 1, reward: 200, color: 'text-success' },
  { title: 'Save $100', desc: 'Put $100 into savings this week', icon: Trophy, duration: 7, reward: 250, color: 'text-primary' },
  { title: 'No Amazon Month', desc: '30 days without Amazon purchases', icon: Zap, duration: 30, reward: 500, color: 'text-danger' },
];

export default function Challenges() {
  const { isPremium, loading } = usePremiumStatus();
  const [challenges, setChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const load = async () => {
    try {
      const [c, a] = await Promise.all([
        base44.entities.Challenge.list('-created_date', 20),
        base44.entities.Achievement.list('-created_date', 20),
      ]);
      setChallenges(c);
      setAchievements(a);
    } catch { /* let it pass */ }
    setDataLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading || dataLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const active = challenges.find(c => c.status === 'active');
  const completed = challenges.filter(c => c.status === 'completed');
  const totalXP = completed.reduce((s, c) => s + (c.reward_xp || 0), 0);

  if (!isPremium) {
    return (
      <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
        <h1 className="text-2xl font-bold font-heading mb-2">Challenges</h1>
        <p className="text-sm text-muted-foreground mb-6">Build better habits with gamified challenges. Track streaks, earn XP, and celebrate wins.</p>
        <div className="grid grid-cols-2 gap-3 mb-6 blur-sm pointer-events-none select-none">
          {challengeTemplates.slice(0, 4).map((c, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4">
              <c.icon className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{c.title}</p>
            </div>
          ))}
        </div>
        <PaywallCard title="Turn saving into a game" description="Weekly challenges, streak tracking, XP, and achievements. Make better money habits feel rewarding." onUpgrade={() => {}} />
      </div>
    );
  }

  const startChallenge = async (template) => {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + template.duration);
    try {
      await base44.entities.Challenge.create({
        title: template.title,
        description: template.desc,
        duration_days: template.duration,
        status: 'active',
        progress: 0,
        streak: 1,
        start_date: startDate,
        end_date: endDate.toISOString().split('T')[0],
        reward_xp: template.reward,
      });
      load();
    } catch { /* let it pass */ }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <h1 className="text-2xl font-bold font-heading mb-2">Challenges</h1>

      {/* XP Header */}
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground">TOTAL XP</p>
        </div>
        <p className="text-4xl font-bold font-heading text-primary">{totalXP}</p>
        <p className="text-xs text-muted-foreground mt-1">{completed.length} challenges completed</p>
      </div>

      {/* Active challenge */}
      {active && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">Active challenge</h2>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-primary/30 bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-lg">{active.title}</p>
                <p className="text-xs text-muted-foreground">{active.description}</p>
              </div>
              <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">{active.streak || 1}</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Day {Math.round(active.progress || 0)} of {active.duration_days}</span>
                <span>+{active.reward_xp} XP</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${((active.progress || 0) / active.duration_days) * 100}%` }}
                  className="h-full bg-primary rounded-full" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Ends {new Date(active.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </motion.div>
        </div>
      )}

      {/* Available challenges */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3">Available challenges</h2>
        <div className="space-y-3">
          {challengeTemplates.map((c, i) => {
            const isDone = completed.find(comp => comp.title === c.title);
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <c.icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                  {isDone ? (
                    <div className="flex items-center gap-1 text-xs text-success">
                      <Check className="w-4 h-4" /> Done
                    </div>
                  ) : (
                    <button onClick={() => startChallenge(c)}
                      className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                      Start
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 pl-12">
                  <span className="text-[10px] text-muted-foreground">{c.duration} day{c.duration > 1 ? 's' : ''}</span>
                  <span className="text-[10px] text-primary font-medium">+{c.reward} XP</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Achievements</h2>
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((a, i) => (
              <motion.div key={a.id || i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border p-4 text-center ${a.is_unlocked ? 'border-primary/30 bg-primary/5' : 'border-border bg-card opacity-60'}`}>
                <div className="text-2xl mb-1">{a.is_unlocked ? (a.icon || '🏆') : '🔒'}</div>
                <p className="text-[10px] font-medium leading-tight">{a.title}</p>
                {!a.is_unlocked && <p className="text-[9px] text-muted-foreground mt-1">{a.progress || 0}/{a.target || 1}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}