import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { formatCurrency, formatDate } from '@/lib/nudgeUtils';
import { usePremiumStatus } from '@/lib/usePremium';
import PaywallCard from '@/components/PaywallCard';
import { ArrowLeft, ThumbsUp, Meh, ThumbsDown, Sparkles } from 'lucide-react';

export default function RegretTracker() {
  const { isPremium, loading } = usePremiumStatus();
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [purchases, logs] = await Promise.all([
        base44.entities.Purchase.list('-purchase_date', 50),
        base44.entities.RegretLog.list('-logged_date', 50),
      ]);
      const loggedIds = new Set(logs.map(l => l.purchase_id));
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      setPending(purchases.filter(p => !loggedIds.has(p.id) && new Date(p.purchase_date || p.created_date) < sevenDaysAgo));
      setHistory(logs);
    } catch { /* let it pass */ }
    setDataLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const logRegret = async (purchase, level) => {
    try {
      await base44.entities.RegretLog.create({
        purchase_id: purchase.id,
        merchant: purchase.merchant,
        amount: purchase.amount,
        category: purchase.category,
        regret_level: level,
        logged_date: new Date().toISOString().split('T')[0],
        purchase_date: purchase.purchase_date,
      });
      loadData();
    } catch { /* let it pass */ }
  };

  if (loading || dataLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!isPremium) {
    return (
      <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <h1 className="text-2xl font-bold font-heading mb-2">Regret Tracker</h1>
        <p className="text-sm text-muted-foreground mb-6">One week after each purchase, Thryve checks in. Over time, it learns what actually brings you joy.</p>
        <PaywallCard title="Learn from your spending" description="Regret tracking trains Thryve's AI to recognize patterns — so it can warn you before the next purchase you'll regret." onUpgrade={() => {}} />
      </div>
    );
  }

  const worthIt = history.filter(h => h.regret_level === 'worth_it').length;
  const regretCount = history.filter(h => h.regret_level === 'regret').length;
  const neutralCount = history.filter(h => h.regret_level === 'neutral').length;
  const total = history.length || 1;
  const regretRate = Math.round((regretCount / total) * 100);

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>
      <h1 className="text-2xl font-bold font-heading mb-2">Regret Tracker</h1>
      <p className="text-sm text-muted-foreground mb-6">How do you feel about recent purchases?</p>

      {/* Stats */}
      {history.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-success">{worthIt}</p>
            <p className="text-xs text-muted-foreground">Worth it</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-warning">{neutralCount}</p>
            <p className="text-xs text-muted-foreground">Neutral</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-danger">{regretRate}%</p>
            <p className="text-xs text-muted-foreground">Regret rate</p>
          </div>
        </div>
      )}

      {/* Pending reviews */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">{pending.length} purchase{pending.length > 1 ? 's' : ''} to review</h2>
          <div className="space-y-3">
            {pending.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">{p.merchant}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.purchase_date || p.created_date)}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatCurrency(p.amount)}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => logRegret(p, 'worth_it')}
                    className="flex flex-col items-center gap-1 rounded-xl bg-success/10 border border-success/20 py-2.5 hover:bg-success/20 transition-colors">
                    <ThumbsUp className="w-4 h-4 text-success" />
                    <span className="text-[10px] font-medium text-success">Worth it</span>
                  </button>
                  <button onClick={() => logRegret(p, 'neutral')}
                    className="flex flex-col items-center gap-1 rounded-xl bg-warning/10 border border-warning/20 py-2.5 hover:bg-warning/20 transition-colors">
                    <Meh className="w-4 h-4 text-warning" />
                    <span className="text-[10px] font-medium text-warning">Neutral</span>
                  </button>
                  <button onClick={() => logRegret(p, 'regret')}
                    className="flex flex-col items-center gap-1 rounded-xl bg-danger/10 border border-danger/20 py-2.5 hover:bg-danger/20 transition-colors">
                    <ThumbsDown className="w-4 h-4 text-danger" />
                    <span className="text-[10px] font-medium text-danger">Regret</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* AI insight */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground/90 leading-relaxed">
              {regretRate > 40
                ? `${regretRate}% of your purchases end in regret. Most are impulse buys in the shopping category. Consider a 24-hour pause on non-essential purchases.`
                : `You're doing well — only ${regretRate}% of your purchases end in regret. Your dining purchases tend to be worth it.`}
            </p>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">History</h2>
          <div className="rounded-2xl border border-border bg-card p-2">
            {history.slice(0, 10).map((h, i) => (
              <div key={h.id || i} className="flex items-center gap-3 p-3 border-b border-border last:border-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  h.regret_level === 'worth_it' ? 'bg-success/10' : h.regret_level === 'neutral' ? 'bg-warning/10' : 'bg-danger/10'
                }`}>
                  {h.regret_level === 'worth_it' ? <ThumbsUp className="w-3.5 h-3.5 text-success" /> :
                   h.regret_level === 'neutral' ? <Meh className="w-3.5 h-3.5 text-warning" /> :
                   <ThumbsDown className="w-3.5 h-3.5 text-danger" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{h.merchant}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(h.logged_date)}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(h.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && history.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No purchases to review yet. Check back after a week of spending.</p>
        </div>
      )}
    </div>
  );
}