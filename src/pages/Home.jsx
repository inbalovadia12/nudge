import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import SavingsRing from '@/components/SavingsRing';
import PurchaseItem from '@/components/PurchaseItem';
import NudgeCard from '@/components/NudgeCard';
import { getGreeting, formatCurrency, formatDateLong, getFinancialContext, buildContextString } from '@/lib/nudgeUtils';
import { ScanSearch, ArrowRight } from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [primaryGoal, setPrimaryGoal] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [nudge, setNudge] = useState('');
  const [nudgeLoading, setNudgeLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const ctx = await getFinancialContext();
        if (!ctx.profile?.onboarding_complete) {
          navigate('/onboarding');
          return;
        }
        setProfile(ctx.profile);
        setPrimaryGoal(ctx.primaryGoal);
        setPurchases(ctx.purchases.slice(0, 5));
        setLoading(false);

        // Generate daily nudge
        try {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: `You are Nudge, a calm AI purchase coach. Based on the user's financial data, give ONE short, encouraging observation (max 2 sentences). Never negative or guilt-inducing. Never use the word "budget". Be specific with numbers.

Financial context: ${buildContextString(ctx)}

Return just the observation text, nothing else. No quotes.`,
          });
          setNudge(response);
        } catch {
          setNudge('You\'re here. That\'s a good start — checking in on your goals is the hardest part.');
        }
        setNudgeLoading(false);
      } catch (err) {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-surface-3 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const progress = primaryGoal ? Math.round((primaryGoal.current_amount / primaryGoal.target_amount) * 100) : 0;
  const greeting = getGreeting(profile?.first_name || 'there');

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">{greeting}.</h1>
      </motion.div>

      {/* Savings Ring */}
      {primaryGoal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex flex-col items-center py-8"
        >
          <SavingsRing progress={progress} size={180} strokeWidth={12} sublabel="there" />
          <h2 className="text-xl font-semibold text-foreground mt-4">{primaryGoal.name}</h2>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {formatCurrency(primaryGoal.current_amount)} of {formatCurrency(primaryGoal.target_amount)}
          </p>
          {primaryGoal.estimated_completion_date && (
            <p className="text-sm text-primary mt-2">
              {progress > 0 ? `On track for ${formatDateLong(primaryGoal.estimated_completion_date)}` : 'Just getting started'}
            </p>
          )}
        </motion.div>
      )}

      {/* Check CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Link
          to="/check"
          className="block bg-surface-1 border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ScanSearch className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Thinking about a purchase?</p>
              <p className="text-sm text-muted-foreground">Get a quick check before you buy.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </motion.div>

      {/* Recent purchases */}
      {purchases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent</h3>
          <div className="bg-surface-1 border border-border rounded-2xl p-4 divide-y divide-border/50">
            {purchases.map(p => <PurchaseItem key={p.id} purchase={p} />)}
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