import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/nudgeUtils';
import { getFinancialContext } from '@/lib/nudgeUtils';
import { ArrowLeft, Shield, TrendingUp, Target, Clock, AlertTriangle, Check, Plus, Eye } from 'lucide-react';

export default function ShoppingShield() {
  const [loading, setLoading] = useState(true);
  const [ctx, setCtx] = useState(null);
  const [recentImpulse, setRecentImpulse] = useState([]);
  const [shieldActive, setShieldActive] = useState(false);
  const [decision, setDecision] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const finCtx = await getFinancialContext();
        setCtx(finCtx);
        const impulse = finCtx.purchases.filter(p => p.source === 'manual' || p.category === 'shopping').slice(0, 3);
        setRecentImpulse(impulse);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const progress = ctx?.primaryGoal ? Math.round((ctx.primaryGoal.current_amount / ctx.primaryGoal.target_amount) * 100) : 0;
  const spentPct = ctx?.profile?.monthly_income > 0 ? Math.round(((ctx?.totalSpent || 0) / ctx.profile.monthly_income) * 100) : 0;
  const streak = 3; // simulated streak

  const handleDecision = (d) => {
    setDecision(d);
  };

  const decisions = [
    { id: 'continue', label: 'Continue', desc: 'Go ahead and shop', icon: Check, color: 'text-success bg-success/10 border-success/30' },
    { id: 'wait', label: 'Wait 24 Hours', desc: 'Sleep on it first', icon: Clock, color: 'text-warning bg-warning/10 border-warning/30' },
    { id: 'wishlist', label: 'Add to Wishlist', desc: 'Save it for later', icon: Plus, color: 'text-primary bg-primary/10 border-primary/30' },
    { id: 'track', label: 'Track Price', desc: 'Get alerted on drops', icon: Eye, color: 'text-violet-500 bg-violet-500/10 border-violet-500/30' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold font-heading">Shopping Shield</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">A quick checkpoint before you shop. No guilt — just context.</p>

      {/* Shield toggle */}
      <div className={`rounded-2xl border p-5 mb-6 transition-all ${shieldActive ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${shieldActive ? 'bg-primary/15' : 'bg-surface-2'}`}>
              <Shield className={`w-6 h-6 ${shieldActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{shieldActive ? 'Shield is active' : 'Shield is off'}</p>
              <p className="text-xs text-muted-foreground">{shieldActive ? 'You\'ll see this before shopping apps' : 'Tap to activate before you shop'}</p>
            </div>
          </div>
          <button
            onClick={() => setShieldActive(!shieldActive)}
            className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${shieldActive ? 'bg-primary' : 'bg-muted'}`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow ${shieldActive ? 'left-7' : 'left-1'}`}
            />
          </button>
        </div>
      </div>

      {shieldActive ? (
        <>
          {/* Context cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Goal</span>
              </div>
              <p className="text-lg font-bold text-foreground">{progress}%</p>
              <p className="text-[10px] text-muted-foreground">{ctx?.primaryGoal?.name || 'No goal set'}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Spent</span>
              </div>
              <p className="text-lg font-bold text-foreground">{spentPct}%</p>
              <p className="text-[10px] text-muted-foreground">of monthly income</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">🔥 Streak</span>
              </div>
              <p className="text-lg font-bold text-foreground">{streak} days</p>
              <p className="text-[10px] text-muted-foreground">no-spend streak</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Impulse</span>
              </div>
              <p className="text-lg font-bold text-foreground">{recentImpulse.length}</p>
              <p className="text-[10px] text-muted-foreground">recent purchases</p>
            </div>
          </div>

          {/* Decision */}
          {decision ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {decision === 'continue' && 'Go for it — shop away.'}
                {decision === 'wait' && 'Good call. I\'ll remind you in 24 hours.'}
                {decision === 'wishlist' && 'Saved! You can revisit it anytime.'}
                {decision === 'track' && 'I\'ll watch the price and alert you on drops.'}
              </p>
              <button onClick={() => setDecision(null)} className="text-xs text-primary mt-2 hover:underline">Reset</button>
            </motion.div>
          ) : (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">What would you like to do?</p>
              <div className="space-y-3">
                {decisions.map(d => (
                  <button
                    key={d.id}
                    onClick={() => handleDecision(d.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] ${d.color}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-card/50 flex items-center justify-center flex-shrink-0">
                      <d.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.label}</p>
                      <p className="text-xs text-muted-foreground">{d.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent impulse purchases */}
          {recentImpulse.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-muted-foreground mb-3">RECENT PURCHASES</p>
              <div className="space-y-2">
                {recentImpulse.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.merchant}</p>
                      <p className="text-[10px] text-muted-foreground">{p.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Activate the shield to get a quick financial context check before entering shopping apps or websites.
          </p>
        </div>
      )}
    </div>
  );
}