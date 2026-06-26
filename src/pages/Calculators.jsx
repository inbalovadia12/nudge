import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePremiumStatus } from '@/lib/usePremium';
import { spendCredits } from '@/lib/useCredits';
import { getFinancialContext, buildContextString } from '@/lib/nudgeUtils';
import { base44 } from '@/api/base44Client';
import CreditBadge from '@/components/CreditBadge';
import SavingsCalculator from '@/components/calculator/SavingsCalculator';
import SplitPaymentCalculator from '@/components/calculator/SplitPaymentCalculator';
import PaywallCard from '@/components/PaywallCard';
import { ArrowLeft, Calculator, Split, PiggyBank, Sparkles, Loader2, TrendingUp } from 'lucide-react';

const TABS = [
  { id: 'savings', label: 'Savings Growth', icon: PiggyBank },
  { id: 'split', label: 'Split vs One-Time', icon: Split },
];

export default function Calculators() {
  const { isPremium, loading } = usePremiumStatus();
  const [tab, setTab] = useState('savings');
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [lastCalc, setLastCalc] = useState(null);
  const [creditRefreshKey, setCreditRefreshKey] = useState(0);

  const getAiInsight = async (calcData) => {
    if (!isPremium) return;
    setLastCalc(calcData);
    setInsightLoading(true);
    setInsight(null);

    const spend = await spendCredits('calculator_ai_insight');
    if (!spend.success) {
      setInsight("You're out of AI credits. Upgrade your plan to keep getting AI-powered insights.");
      setInsightLoading(false);
      setCreditRefreshKey(k => k + 1);
      return;
    }
    setCreditRefreshKey(k => k + 1);

    try {
      const ctx = await getFinancialContext();
      const contextString = buildContextString(ctx);
      const prompt = `You are Nudge, a financial coach. The user just used a financial calculator. Here is their calculation result:\n\n${calcData.summary}\n\nTheir financial context:\n${contextString}\n\nGive 2-3 short, actionable insights. For savings: how increasing contributions helps, alternative scenarios, tips to reach goals faster. For split payments: whether splitting is a good or bad idea, cheaper alternatives, impact on goals. Be warm, concise, and specific to their numbers. 3-4 sentences max.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt, model: 'claude_sonnet_4_6' });
      setInsight(typeof response === 'string' ? response : response?.content || String(response));
    } catch {
      setInsight("I couldn't generate insights right now. Try again in a moment.");
    }
    setInsightLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  if (!isPremium) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold font-heading">Smart Calculators</h1>
          </div>
          <p className="text-sm text-muted-foreground">Project your savings growth and compare payment strategies.</p>
        </div>
        <PaywallCard title="Smart Interest & Payment Calculators" description="Model your savings growth, compare split payments vs one-time, and get AI-powered recommendations to reach your goals faster." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold font-heading">Smart Calculators</h1>
        </div>
        <CreditBadge refreshKey={creditRefreshKey} />
      </div>
      <p className="text-sm text-muted-foreground mb-6">Project your savings growth and compare payment strategies.</p>

      {/* Tab switcher */}
      <div className="inline-flex items-center bg-surface-2 rounded-xl p-1 mb-6 w-full sm:w-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setInsight(null); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.id === 'savings' ? 'Savings' : 'Split'}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'savings'
            ? <SavingsCalculator onCalculate={getAiInsight} lastCalc={lastCalc} />
            : <SplitPaymentCalculator onCalculate={getAiInsight} lastCalc={lastCalc} />}
        </motion.div>
      </AnimatePresence>

      {/* AI Insight */}
      {(insightLoading || insight) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">AI Insight</span>
          </div>
          {insightLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your numbers...
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{insight}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}