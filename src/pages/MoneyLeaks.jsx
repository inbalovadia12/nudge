import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/nudgeUtils';
import { getFinancialContext, buildContextString } from '@/lib/nudgeUtils';
import { ArrowLeft, Droplets, Loader2, TrendingDown, Sparkles } from 'lucide-react';

export default function MoneyLeaks() {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [leaks, setLeaks] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [ctx, setCtx] = useState(null);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const [subs, purchases, habits] = await Promise.all([
        base44.entities.Subscription.filter({ status: 'active' }),
        base44.entities.Purchase.list('-purchase_date', 50),
        base44.entities.SpendingHabit.list('-detected_date', 10),
      ]);

      const finCtx = await getFinancialContext();
      setCtx(finCtx);

      const detectedLeaks = [];

      // Unused subscriptions
      subs.filter(s => s.usage_signal === 'none' || s.usage_signal === 'low').forEach(s => {
        detectedLeaks.push({
          type: 'subscription',
          title: `${s.name} — ${s.usage_signal === 'none' ? 'unused' : 'barely used'}`,
          desc: `You're paying ${formatCurrency(s.monthly_cost)}/mo but haven't been using it.`,
          annual: (s.monthly_cost || 0) * 12,
          icon: '📺',
          action: 'Cancel',
        });
      });

      // Duplicate subscriptions
      const byCategory = {};
      subs.forEach(s => {
        if (!byCategory[s.category]) byCategory[s.category] = [];
        byCategory[s.category].push(s);
      });
      Object.entries(byCategory).forEach(([cat, items]) => {
        if (items.length > 1) {
          const total = items.reduce((s, x) => s + (x.monthly_cost || 0), 0);
          detectedLeaks.push({
            type: 'duplicate',
            title: `Duplicate ${cat} subscriptions`,
            desc: `${items.map(i => i.name).join(' + ')} overlap. You might only need one.`,
            annual: total * 12,
            icon: '🔁',
            action: 'Review',
          });
        }
      });

      // Price increases
      subs.filter(s => s.cheaper_tier_available).forEach(s => {
        detectedLeaks.push({
          type: 'price',
          title: `${s.name} has a cheaper plan`,
          desc: 'A lower tier might cover everything you actually use.',
          annual: (s.monthly_cost || 0) * 6,
          icon: '💰',
          action: 'Downgrade',
        });
      });

      // Frequent takeout / dining
      const diningPurchases = purchases.filter(p => p.category === 'dining');
      if (diningPurchases.length >= 5) {
        const diningTotal = diningPurchases.reduce((s, p) => s + (p.amount || 0), 0);
        detectedLeaks.push({
          type: 'habit',
          title: 'Frequent dining out',
          desc: `${diningPurchases.length} dining charges recently. Eating in twice a week could save a lot.`,
          annual: Math.round(diningTotal * 0.4) * 12,
          icon: '🍽️',
          action: 'Reduce',
        });
      }

      // Spending habits from AI
      habits.filter(h => h.severity === 'high').forEach(h => {
        detectedLeaks.push({
          type: 'pattern',
          title: h.title,
          desc: h.description,
          annual: 600,
          icon: '🧠',
          action: 'Adjust',
        });
      });

      // Use AI if not enough data
      if (detectedLeaks.length < 3) {
        try {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: `You are Thryve, a financial coach. Analyze this user's financial data and identify 2-3 "money leaks" — wasteful spending patterns they might not notice. Be specific and encouraging, never shaming.

Financial context: ${buildContextString(finCtx)}

Return JSON array of objects with: title (short), desc (1-2 sentences), annual (estimated annual savings as number), icon (emoji), action (1-2 word CTA). Return ONLY the JSON array.`,
            response_json_schema: {
              type: 'object',
              properties: {
                leaks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      desc: { type: 'string' },
                      annual: { type: 'number' },
                      icon: { type: 'string' },
                      action: { type: 'string' },
                    },
                  },
                },
              },
            },
          });
          if (response?.leaks) {
            response.leaks.forEach(l => detectedLeaks.push({ ...l, type: 'ai' }));
          }
        } catch {}
      }

      const total = detectedLeaks.reduce((s, l) => s + (l.annual || 0), 0);
      setLeaks(detectedLeaks);
      setTotalSavings(total);
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
          <p className="text-sm text-muted-foreground">Analyzing your spending for leaks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>
      <div className="flex items-center gap-2 mb-1">
        <Droplets className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold font-heading">Money Leaks</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Small drips that add up to a lot over a year.</p>

      {/* Total savings banner */}
      {totalSavings > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-primary/20 bg-primary/5 p-6 mb-6 text-center"
        >
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <TrendingDown className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Potential annual savings</span>
          </div>
          <p className="text-4xl font-bold font-heading text-primary">{formatCurrency(totalSavings)}</p>
          <p className="text-xs text-muted-foreground mt-2">If you addressed all {leaks.length} leaks below</p>
        </motion.div>
      )}

      {leaks.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-10 h-10 text-success mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No major leaks detected!</p>
          <p className="text-xs text-muted-foreground mt-1">You're doing great. Keep logging purchases to help me find more.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaks.map((leak, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0 text-lg">
                  {leak.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{leak.title}</p>
                    <span className="text-sm font-semibold text-success whitespace-nowrap">+{formatCurrency(leak.annual)}/yr</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{leak.desc}</p>
                  <button className="mt-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                    {leak.action}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}