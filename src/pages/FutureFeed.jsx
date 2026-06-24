import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/nudgeUtils';
import { ArrowLeft, Calendar, Zap, TrendingUp, AlertCircle, Trophy, DollarSign, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const eventIcons = {
  subscription: Zap,
  goal: Trophy,
  paycheck: DollarSign,
  bill: AlertCircle,
  milestone: TrendingUp,
};

const eventColors = {
  subscription: 'text-violet-500 bg-violet-500/10',
  goal: 'text-primary bg-primary/10',
  paycheck: 'text-success bg-success/10',
  bill: 'text-warning bg-warning/10',
  milestone: 'text-primary bg-primary/10',
};

export default function FutureFeed() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [profiles, goals, subs, bills, purchases] = await Promise.all([
          base44.entities.UserProfile.list(),
          base44.entities.SavingsGoal.filter({ status: 'active' }),
          base44.entities.Subscription.filter({ status: 'active' }),
          base44.entities.Bill.filter({ status: 'upcoming' }),
          base44.entities.Purchase.list('-purchase_date', 5),
        ]);

        const p = profiles[0] || {};
        setProfile(p);

        const today = new Date();
        const allEvents = [];

        // Subscription renewals
        subs.forEach(s => {
          if (s.next_renewal_date) {
            const d = new Date(s.next_renewal_date);
            if (d >= today) {
              allEvents.push({ type: 'subscription', title: `${s.name} renews`, amount: s.monthly_cost, date: d, desc: `${s.billing_cycle} renewal` });
            }
          }
        });

        // Bill due dates
        bills.forEach(b => {
          if (b.due_date) {
            const d = new Date(b.due_date);
            if (d >= today) {
              allEvents.push({ type: 'bill', title: `${b.name} due`, amount: b.amount, date: d, desc: b.recurrence || 'monthly' });
            }
          }
        });

        // Goal milestones
        goals.forEach(g => {
          if (g.estimated_completion_date || g.target_date) {
            const d = new Date(g.estimated_completion_date || g.target_date);
            if (d >= today) {
              allEvents.push({ type: 'goal', title: `${g.name} achieved`, amount: g.target_amount, date: d, desc: `${Math.round((g.current_amount / g.target_amount) * 100)}% there` });
            }
          }
          // Next milestone (25%, 50%, 75%)
          const pct = g.current_amount / g.target_amount;
          const milestones = [0.25, 0.5, 0.75];
          for (const m of milestones) {
            if (pct < m) {
              const targetAmt = g.target_amount * m;
              const remaining = targetAmt - g.current_amount;
              const monthlySave = (p.monthly_income || 0) * 0.2;
              if (monthlySave > 0) {
                const monthsAway = Math.ceil(remaining / monthlySave);
                const d = new Date();
                d.setMonth(d.getMonth() + monthsAway);
                allEvents.push({ type: 'milestone', title: `${g.name} — ${Math.round(m * 100)}% milestone`, date: d, desc: `${formatCurrency(targetAmt)} saved` });
              }
              break;
            }
          }
        });

        // Next paycheck (1st of next month)
        const nextPay = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        allEvents.push({ type: 'paycheck', title: 'Expected paycheck', amount: p.monthly_income || 0, date: nextPay, desc: 'Estimated deposit' });

        allEvents.sort((a, b) => a.date - b.date);
        setEvents(allEvents);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDateLabel = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 7) return `In ${diff} days`;
    if (diff < 14) return 'Next week';
    if (diff < 30) return `In ${diff} days`;
    if (diff < 60) return 'Next month';
    const months = Math.round(diff / 30);
    return `In ${months} months`;
  };

  const formatDateExact = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>
      <h1 className="text-2xl font-bold font-heading mb-1">Future Feed</h1>
      <p className="text-sm text-muted-foreground mb-6">What's coming up in your financial life.</p>

      {events.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No upcoming events yet. Add goals, bills, or subscriptions to see your timeline.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

          {events.map((event, i) => {
            const EventIcon = eventIcons[event.type] || Calendar;
            const colorClass = eventColors[event.type] || 'text-muted-foreground bg-muted/10';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative flex gap-4 pb-5"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${colorClass} ring-4 ring-background`}>
                  <EventIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{event.desc}</p>
                    </div>
                    {event.amount != null && event.amount > 0 && (
                      <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(event.amount)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium text-primary">{formatDateLabel(event.date)}</span>
                    <span className="text-[10px] text-muted-foreground">· {formatDateExact(event.date)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}