import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/nudgeUtils';
import { getFinancialContext, buildContextString, buildNudgeSystemPrompt } from '@/lib/nudgeUtils';
import CreditBadge from '@/components/CreditBadge';
import { spendCredits } from '@/lib/useCredits';
import { ArrowLeft, Brain, Send, Loader2, TrendingUp, Sparkles, RotateCcw } from 'lucide-react';

const scenarios = [
  { label: 'Buy a $500 item', text: 'What happens if I buy something for $500 right now?' },
  { label: 'Save $200 more/month', text: 'What if I save $200 more per month?' },
  { label: 'Cancel 2 subscriptions', text: 'What if I cancel 2 of my subscriptions?' },
  { label: 'Get a 10% raise', text: 'What if I get a 10% raise?' },
];

export default function FinancialTwin() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [customQuery, setCustomQuery] = useState('');
  const [creditRefreshKey, setCreditRefreshKey] = useState(0);

  const analyze = async (query) => {
    setLoading(true);
    setResult(null);

    const spend = await spendCredits('financial_simulation');
    if (!spend.success) {
      setResult({
        summary: "You're out of AI credits or your plan doesn't include Financial Twin. Upgrade to Pro to access this feature.",
        monthly_impact: 0,
        annual_impact: 0,
        goal_impact: 'Upgrade required',
        note: 'Upgrade to Pro for full Financial Twin access.',
      });
      setLoading(false);
      setCreditRefreshKey(k => k + 1);
      return;
    }
    setCreditRefreshKey(k => k + 1);

    try {
      const ctx = await getFinancialContext();
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: buildNudgeSystemPrompt(buildContextString(ctx), {
          extraRules: `You're acting as the user's Financial Twin — an AI model of their financial behavior. The user asks "what if" questions, and you project the financial impact.

User's question: ${query}

Provide a projection with:
1. A short summary (1-2 sentences)
2. The projected monthly impact (as a number, can be negative)
3. The projected annual impact (as a number)
4. Impact on their savings goal timeline (e.g., "delays goal by 2 months" or "accelerates by 1 month")
5. One encouraging note or suggestion

Be honest but warm. Explain your numbers. Return as JSON.`
        }),
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            monthly_impact: { type: 'number' },
            annual_impact: { type: 'number' },
            goal_impact: { type: 'string' },
            note: { type: 'string' },
          },
        },
      });
      setResult(response);
    } catch {
      setResult({
        summary: 'I need more financial data to make a good projection. Try logging some purchases and setting up a goal first.',
        monthly_impact: 0,
        annual_impact: 0,
        goal_impact: 'Not enough data',
        note: 'The more you use Nudigo, the smarter my projections become.',
      });
    }
    setLoading(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>
      <div className="flex items-center gap-2 mb-1">
        <Brain className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold font-heading">Financial Twin</h1>
      </div>
      <div className="mb-4">
        <CreditBadge refreshKey={creditRefreshKey} />
      </div>
      <p className="text-sm text-muted-foreground mb-6">Ask "what if" and I'll project the financial impact.</p>

      {/* Scenario chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {scenarios.map(s => (
          <button
            key={s.label}
            onClick={() => analyze(s.text)}
            disabled={loading}
            className="text-xs bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 rounded-full px-3 py-2 transition-colors disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={customQuery}
          onChange={e => setCustomQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && customQuery.trim() && analyze(customQuery)}
          placeholder="What if I...?"
          disabled={loading}
          className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
        />
        <button
          onClick={() => customQuery.trim() && analyze(customQuery)}
          disabled={loading || !customQuery.trim()}
          className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          {loading ? <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" /> : <Send className="w-5 h-5 text-primary-foreground" />}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-primary/15 flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Modeling the impact...</p>
        </motion.div>
      )}

      {/* Result */}
      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-3xl border border-border bg-card p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Projection</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-4">{result.summary}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Monthly</p>
                <p className={`text-lg font-bold ${result.monthly_impact >= 0 ? 'text-success' : 'text-danger'}`}>
                  {result.monthly_impact >= 0 ? '+' : ''}{formatCurrency(result.monthly_impact)}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Annual</p>
                <p className={`text-lg font-bold ${result.annual_impact >= 0 ? 'text-success' : 'text-danger'}`}>
                  {result.annual_impact >= 0 ? '+' : ''}{formatCurrency(result.annual_impact)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-primary/5 border border-primary/20 p-3 mb-4">
              <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-foreground">{result.goal_impact}</p>
            </div>

            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground italic">{result.note}</p>
            </div>
          </div>

          <button
            onClick={() => { setResult(null); setCustomQuery(''); }}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground py-3"
          >
            <RotateCcw className="w-4 h-4" /> Ask another question
          </button>
        </motion.div>
      )}
    </div>
  );
}