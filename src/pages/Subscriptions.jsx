import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { formatCurrency, formatDate } from '@/lib/nudgeUtils';
import { usePremiumStatus } from '@/lib/usePremium';
import PaywallCard from '@/components/PaywallCard';
import { ArrowLeft, AlertTriangle, TrendingUp, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Subscriptions() {
  const { isPremium, loading } = usePremiumStatus();
  const [subs, setSubs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    base44.entities.Subscription.filter({ status: 'active' })
      .then(s => setSubs(s.sort((a, b) => (b.monthly_cost || 0) - (a.monthly_cost || 0))))
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, []);

  if (loading || dataLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const monthlyTotal = subs.reduce((s, sub) => s + (sub.monthly_cost || 0), 0);
  const yearlyTotal = monthlyTotal * 12;
  const duplicates = subs.filter(s => s.is_duplicate);
  const unused = subs.filter(s => s.usage_signal === 'none');
  const priceIncreases = subs.filter(s => s.price_at_signup && s.monthly_cost > s.price_at_signup);
  const potentialSavings = duplicates.reduce((s, sub) => s + sub.monthly_cost, 0) + unused.reduce((s, sub) => s + sub.monthly_cost, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>

      {/* Hero number */}
      <div className="text-center mb-8">
        <p className="text-xs font-semibold text-muted-foreground mb-2">YOU'RE SPENDING</p>
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl font-bold font-heading text-primary"
        >
          {formatCurrency(monthlyTotal)}
        </motion.p>
        <p className="text-sm text-muted-foreground mt-2">per month on subscriptions</p>
        <p className="text-xs text-muted-foreground/70 mt-1">That's {formatCurrency(yearlyTotal)} per year</p>
      </div>

      {/* Subscription list */}
      <div className="rounded-3xl border border-border bg-card p-5 mb-6">
        <div className="divide-y divide-border">
          {subs.map(sub => {
            const priceIncrease = sub.price_at_signup && sub.monthly_cost > sub.price_at_signup;
            const increasePercent = priceIncrease ? Math.round(((sub.monthly_cost - sub.price_at_signup) / sub.price_at_signup) * 100) : 0;
            return (
              <div key={sub.id} className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{sub.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground capitalize">{sub.category}</span>
                    <span className="text-xs text-muted-foreground">· Renews {formatDate(sub.next_renewal_date)}</span>
                    {sub.usage_signal === 'none' && <span className="text-[10px] text-warning">No usage detected</span>}
                    {sub.is_duplicate && <span className="text-[10px] text-warning">Possible duplicate</span>}
                    {priceIncrease && <span className="text-[10px] text-danger">↑{increasePercent}% since signup</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatCurrency(sub.monthly_cost)}</p>
                  <p className="text-[10px] text-muted-foreground">/mo</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium: Cancellation suggestions */}
      {isPremium ? (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">Cancellation suggestions</h2>
          <div className="space-y-3">
            {duplicates.length > 0 && (
              <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Duplicate coverage detected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {duplicates.map(d => d.name).join(', ')} overlaps with other streaming services. Consider cancelling to save {formatCurrency(duplicates.reduce((s, d) => s + d.monthly_cost, 0))}/mo.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {unused.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">No usage detected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {unused.map(u => u.name).join(', ')} — you haven't used these. Cancelling saves {formatCurrency(unused.reduce((s, u) => s + u.monthly_cost, 0))}/mo.
                    </p>
                    <div className="flex gap-2 mt-3">
                      {unused.map(u => (
                        <a key={u.id} href={u.cancellation_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                          Cancel {u.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {potentialSavings > 0 && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Potential monthly savings</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(potentialSavings)}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <PaywallCard
          title="Smart cancellation suggestions"
          description="Vesper can detect duplicate subscriptions, unused services, and price increases — and help you cancel in one tap."
          onUpgrade={() => {}}
        />
      )}
    </div>
  );
}