import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePremiumStatus } from '@/lib/usePremium';
import PaywallCard from '@/components/PaywallCard';
import { ArrowLeft, Play, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

const presetScenarios = [
  { label: 'Cancel unused subscriptions', desc: 'Stop paying for 4 services you don\'t use', monthlySavings: 67 },
  { label: 'Cut dining out by 50%', desc: 'Cook at home more often', monthlySavings: 206 },
  { label: 'Skip coffee purchases', desc: 'Make it at home instead', monthlySavings: 80 },
  { label: 'Save $10/day', desc: 'Small consistent saving', monthlySavings: 300 },
  { label: 'Get a 10% raise', desc: 'Model the impact of higher income', monthlySavings: 500 },
  { label: 'Buy a $800 laptop', desc: 'One-time purchase impact', monthlySavings: -800 },
];

function generateProjection(monthlySavings, months = 12) {
  const data = [];
  let cumulative = 0;
  for (let m = 0; m <= months; m++) {
    cumulative += monthlySavings;
    data.push({ month: m, savings: Math.round(cumulative) });
  }
  return data;
}

export default function Simulator() {
  const { isPremium, loading } = usePremiumStatus();
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [customText, setCustomText] = useState('');
  const [projection, setProjection] = useState(null);
  const [running, setRunning] = useState(false);

  const runScenario = (monthlySavings) => {
    setRunning(true);
    setTimeout(() => {
      setProjection(generateProjection(monthlySavings));
      setRunning(false);
    }, 800);
  };

  const handleCustom = () => {
    if (!customText.trim()) return;
    // Simple parsing — in production this would call the AI
    const match = customText.match(/\$?(\d+)/);
    const amount = match ? parseInt(match[1]) : 50;
    runScenario(amount);
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!isPremium) {
    return (
      <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <h1 className="text-2xl font-bold font-heading mb-2">Financial Simulator</h1>
        <p className="text-sm text-muted-foreground mb-6">What if you changed one thing? Model the outcome over 3, 6, and 12 months.</p>

        <div className="grid grid-cols-2 gap-2 mb-6 blur-sm pointer-events-none">
          {presetScenarios.slice(0, 4).map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        <PaywallCard
          title="Model your financial what-ifs"
          description="Run scenarios with one tap. See projected savings curves with clear milestones. No jargon, just clarity."
          onUpgrade={() => {}}
        />
      </div>
    );
  }

  const milestones = projection ? [
    { month: 3, label: '3 months' },
    { month: 6, label: '6 months' },
    { month: 12, label: '12 months' },
  ] : [];

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>
      <h1 className="text-2xl font-bold font-heading mb-2">Financial Simulator</h1>
      <p className="text-sm text-muted-foreground mb-6">Pick a scenario and see what happens.</p>

      {/* Preset scenarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        {presetScenarios.map((s, i) => (
          <button
            key={i}
            onClick={() => { setSelectedScenario(s); runScenario(s.monthlySavings); }}
            className={`text-left rounded-xl border p-3 transition-all ${selectedScenario?.label === s.label ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'}`}
          >
            <p className="text-sm font-medium">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            <p className="text-xs text-primary font-semibold mt-1">
              {s.monthlySavings > 0 ? `+$${s.monthlySavings}/mo` : `-$${Math.abs(s.monthlySavings)} one-time`}
            </p>
          </button>
        ))}
      </div>

      {/* Custom scenario */}
      <div className="rounded-2xl border border-border bg-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium">Custom scenario</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustom()}
            placeholder="e.g., Cancel Netflix and cook 3x/week"
            className="flex-1 bg-input border border-border rounded-xl px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleCustom}
            className="bg-primary text-primary-foreground rounded-xl px-4 text-sm font-semibold hover:bg-primary/90"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projection chart */}
      {running && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {projection && !running && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <p className="text-sm font-semibold mb-4">Projected savings</p>
          <div className="h-48 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projection}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                  formatter={v => [`$${v}`, 'Savings']}
                  labelFormatter={v => `Month ${v}`}
                />
                {milestones.map(m => (
                  <ReferenceLine key={m.month} x={m.month} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: m.label, fontSize: 9, fill: 'hsl(var(--muted-foreground))', position: 'top' }} />
                ))}
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Milestone summary */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {milestones.map(m => {
              const point = projection.find(p => p.month === m.month);
              return (
                <div key={m.month} className="text-center">
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <p className="text-sm font-bold text-primary">{point ? `$${point.savings.toLocaleString()}` : '-'}</p>
                </div>
              );
            })}
          </div>

          {selectedScenario && (
            <p className="text-sm text-foreground/80 text-center mt-4 leading-relaxed">
              {selectedScenario.monthlySavings > 0
                ? `If you ${selectedScenario.label.toLowerCase()}, you'd save an extra $${(selectedScenario.monthlySavings * 12).toLocaleString()} over a year.`
                : `Buying this would set you back $${Math.abs(selectedScenario.monthlySavings)} right now.`}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}