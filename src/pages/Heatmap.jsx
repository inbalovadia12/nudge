import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/nudgeUtils';
import { usePremiumStatus } from '@/lib/usePremium';
import PaywallCard from '@/components/PaywallCard';
import { ArrowLeft, Moon, Calendar } from 'lucide-react';

function getIntensityColor(amount) {
  if (amount === 0) return 'bg-card';
  if (amount < 20) return 'bg-indigo-100/10';
  if (amount < 50) return 'bg-indigo-300/20';
  if (amount < 100) return 'bg-indigo-400/30';
  if (amount < 150) return 'bg-indigo-500/40';
  if (amount < 200) return 'bg-indigo-600/60';
  return 'bg-indigo-700/80';
}

// Generate sample 35-day spending data
function generateHeatmapData(purchases) {
  const data = {};
  const today = new Date();
  for (let i = 34; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    data[key] = { date, amount: 0, purchases: [] };
  }
  purchases.forEach(p => {
    const key = (p.date || p.purchase_date || p.created_date)?.split('T')[0];
    if (data[key]) {
      data[key].amount += p.amount || 0;
      data[key].purchases.push(p);
    }
  });
  return data;
}

export default function Heatmap() {
  const { isPremium, loading } = usePremiumStatus();
  const [purchases, setPurchases] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    base44.entities.Purchase.list('-date', 100)
      .then(setPurchases)
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, []);

  if (loading || dataLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const heatmapData = generateHeatmapData(purchases);
  const days = Object.values(heatmapData);

  if (!isPremium) {
    return (
      <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <h1 className="text-2xl font-bold font-heading mb-2">Spending Heatmap</h1>
        <p className="text-sm text-muted-foreground mb-6">See your spending patterns spatially — the dark Saturdays, payday splurges, and quiet streaks.</p>

        {/* Blurred preview */}
        <div className="grid grid-cols-7 gap-1.5 mb-6 blur-sm pointer-events-none select-none">
          {days.map((day, i) => (
            <div key={i} className={`aspect-square rounded-lg ${getIntensityColor(day.amount)}`} />
          ))}
        </div>

        <PaywallCard
          title="See your patterns spatially"
          description="Unlock the full heatmap with tappable days, weekly AI commentary, and pattern annotations."
          onUpgrade={() => {}}
        />
      </div>
    );
  }

  const selectedPurchases = selectedDay ? heatmapData[selectedDay] : null;
  const today = new Date();
  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>
      <h1 className="text-2xl font-bold font-heading mb-2">Spending Heatmap</h1>
      <p className="text-sm text-muted-foreground mb-6">Each square is a day. Darker = more spending.</p>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {weekdayLabels.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">{d}</div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-6">
        {days.map((day, i) => {
          const dateStr = day.date.toISOString().split('T')[0];
          const isSelected = selectedDay === dateStr;
          const isToday = dateStr === today.toISOString().split('T')[0];
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDay(dateStr)}
              className={`aspect-square rounded-lg relative ${getIntensityColor(day.amount)} ${isSelected ? 'ring-2 ring-primary' : ''} ${isToday ? 'ring-1 ring-primary/50' : ''}`}
            >
              {isWeekend && day.amount > 50 && (
                <Calendar className="absolute top-0.5 right-0.5 w-2 h-2 text-primary/50" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-muted-foreground">Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-card border border-border" />
          <div className="w-4 h-4 rounded bg-indigo-300/20" />
          <div className="w-4 h-4 rounded bg-indigo-400/30" />
          <div className="w-4 h-4 rounded bg-indigo-500/40" />
          <div className="w-4 h-4 rounded bg-indigo-600/60" />
          <div className="w-4 h-4 rounded bg-indigo-700/80" />
        </div>
        <span className="text-xs text-muted-foreground">More</span>
      </div>

      {/* Selected day detail */}
      {selectedPurchases && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">
              {selectedPurchases.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-sm font-bold text-primary">{formatCurrency(selectedPurchases.amount)}</p>
          </div>
          {selectedPurchases.purchases.length === 0 ? (
            <p className="text-xs text-muted-foreground">No spending this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedPurchases.purchases.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/80">{p.merchant}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* AI Commentary */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Moon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground/90 leading-relaxed">
            This was your highest spending week in 3 months. Three dining-out charges on Friday and Saturday account for 60% of it.
          </p>
        </div>
      </div>
    </div>
  );
}