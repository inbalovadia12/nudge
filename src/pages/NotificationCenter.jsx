import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/nudgeUtils';
import { getFinancialContext, buildContextString } from '@/lib/nudgeUtils';
import { ArrowLeft, Bell, Check, Zap, TrendingDown, Target, AlertTriangle, Sparkles, Trash2 } from 'lucide-react';

export default function NotificationCenter() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const ctx = await getFinancialContext();
        const alerts = [];

        // Goal milestone alerts
        if (ctx.primaryGoal) {
          const pct = Math.round((ctx.primaryGoal.current_amount / ctx.primaryGoal.target_amount) * 100);
          if (pct >= 75) {
            alerts.push({ id: 'goal-close', type: 'milestone', icon: Target, title: `${ctx.primaryGoal.name} — ${pct}% there!`, desc: 'You\'re in the home stretch.', color: 'text-primary bg-primary/10', read: false });
          } else if (pct >= 50) {
            alerts.push({ id: 'goal-half', type: 'milestone', icon: Target, title: `Halfway to ${ctx.primaryGoal.name}`, desc: 'Great progress — keep it up.', color: 'text-primary bg-primary/10', read: false });
          } else if (pct === 0) {
            alerts.push({ id: 'goal-start', type: 'milestone', icon: Target, title: 'Time to start saving', desc: `Add to ${ctx.primaryGoal.name} to get moving.`, color: 'text-primary bg-primary/10', read: false });
          }
        }

        // Spending alerts
        if (ctx.profile?.monthly_income > 0) {
          const spentPct = Math.round((ctx.totalSpent / ctx.profile.monthly_income) * 100);
          if (spentPct > 80) {
            alerts.push({ id: 'spend-high', type: 'warning', icon: AlertTriangle, title: 'Spending is high this month', desc: `You've used ${spentPct}% of your income. Consider slowing down.`, color: 'text-danger bg-danger/10', read: false });
          } else if (spentPct < 30) {
            alerts.push({ id: 'spend-good', type: 'positive', icon: Check, title: 'You\'re spending wisely', desc: `Only ${spentPct}% of income used so far. Nice work.`, color: 'text-success bg-success/10', read: false });
          }
        }

        // Subscription alerts
        try {
          const subs = await base44.entities.Subscription.filter({ status: 'active' });
          const unused = subs.filter(s => s.usage_signal === 'none' || s.usage_signal === 'low');
          unused.forEach(s => {
            alerts.push({ id: `sub-${s.id}`, type: 'subscription', icon: Zap, title: `${s.name} might be unused`, desc: `You're paying ${formatCurrency(s.monthly_cost)}/mo but haven't been active.`, color: 'text-violet-500 bg-violet-500/10', read: false });
          });

          // Renewal soon
          const soon = new Date();
          soon.setDate(soon.getDate() + 7);
          subs.forEach(s => {
            if (s.next_renewal_date && new Date(s.next_renewal_date) <= soon) {
              alerts.push({ id: `renewal-${s.id}`, type: 'renewal', icon: Bell, title: `${s.name} renews soon`, desc: `${formatCurrency(s.monthly_cost)} on ${new Date(s.next_renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, color: 'text-warning bg-warning/10', read: false });
            }
          });
        } catch {}

        // Price drop alerts
        try {
          const products = await base44.entities.TrackedProduct.filter({ status: 'alert' });
          products.forEach(p => {
            alerts.push({ id: `deal-${p.id}`, type: 'deal', icon: TrendingDown, title: `Price drop: ${p.product_name}`, desc: `Now ${formatCurrency(p.current_price)} — target was ${formatCurrency(p.target_price)}.`, color: 'text-success bg-success/10', read: false });
          });
        } catch {}

        // AI recommendation
        if (alerts.length < 3) {
          try {
            const response = await base44.integrations.Core.InvokeLLM({
              prompt: `You are Nudigo, a calm financial coach. Give ONE actionable financial recommendation based on this context. Be encouraging, specific, and under 2 sentences. Never shame.

Financial context: ${buildContextString(ctx)}

Return just the recommendation text.`,
            });
            alerts.push({ id: 'ai-rec', type: 'ai', icon: Sparkles, title: 'Nudigo recommends', desc: response, color: 'text-primary bg-primary/10', read: false });
          } catch {}
        }

        setNotifications(alerts);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => setNotifications([]);

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold font-heading">Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {unread > 0 ? `${unread} unread alert${unread > 1 ? 's' : ''}` : 'You\'re all caught up'}
      </p>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Check className="w-10 h-10 text-success mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No alerts right now</p>
          <p className="text-xs text-muted-foreground mt-1">I'll let you know when something needs your attention.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border p-4 transition-all ${n.read ? 'border-border bg-card opacity-60' : 'border-primary/20 bg-primary/5'}`}
                onClick={() => markRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.color}`}>
                    <n.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}