import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatCurrencyDetailed } from '@/lib/nudgeUtils';
import { TrendingUp, Target, Calendar, Loader2, Sparkles } from 'lucide-react';

const COMPOUND_FREQS = [
  { label: 'Monthly', n: 12 },
  { label: 'Quarterly', n: 4 },
  { label: 'Annually', n: 1 },
  { label: 'Daily', n: 365 },
];

export default function SavingsCalculator({ onCalculate, lastCalc }) {
  const [initial, setInitial] = useState(1000);
  const [rate, setRate] = useState(4.5);
  const [monthly, setMonthly] = useState(200);
  const [freq, setFreq] = useState(12);
  const [years, setYears] = useState(5);
  const [calculating, setCalculating] = useState(false);

  const result = useMemo(() => {
    const P = Number(initial) || 0;
    const r = (Number(rate) || 0) / 100;
    const PMT = Number(monthly) || 0;
    const n = Number(freq) || 12;
    const t = Number(years) || 1;
    const totalMonths = Math.round(t * 12);

    // Generate monthly data points
    const data = [];
    let balance = P;
    const monthlyRate = r / 12;
    for (let m = 0; m <= totalMonths; m++) {
      if (m > 0) {
        balance = balance * (1 + monthlyRate) + PMT;
      }
      data.push({
        month: m,
        label: m === 0 ? 'Now' : m % 12 === 0 ? `Yr ${m / 12}` : `M${m}`,
        balance: Math.round(balance),
        contributions: P + PMT * m,
        interest: Math.round(balance - (P + PMT * m)),
      });
    }

    const finalBalance = balance;
    const totalContributions = P + PMT * totalMonths;
    const totalInterest = Math.round(finalBalance - totalContributions);

    // Milestones
    const milestones = [];
    const targets = [5000, 10000, 25000, 50000, 100000];
    for (const target of targets) {
      if (target > P) {
        let m = 0;
        let b = P;
        while (b < target && m < totalMonths * 2 + 120) {
          b = b * (1 + monthlyRate) + PMT;
          m++;
        }
        if (m <= totalMonths) {
          milestones.push({ target, months: m, label: m % 12 === 0 ? `${m / 12} yr` : `${m} mo` });
        } else if (m <= totalMonths * 2 + 120) {
          milestones.push({ target, months: m, label: m % 12 === 0 ? `${m / 12} yr` : `${m} mo`, future: true });
        }
      }
    }

    return { data, finalBalance, totalContributions, totalInterest, totalMonths, milestones };
  }, [initial, rate, monthly, freq, years]);

  const handleCalculate = () => {
    setCalculating(true);
    const summary = `Savings Growth Calculator:
- Initial deposit: ${formatCurrencyDetailed(initial)}
- APY: ${rate}%
- Monthly contribution: ${formatCurrencyDetailed(monthly)}
- Compounding: ${COMPOUND_FREQS.find(f => f.n === freq)?.label || 'Monthly'}
- Time: ${years} years
- Final balance: ${formatCurrencyDetailed(result.finalBalance)}
- Total contributions: ${formatCurrencyDetailed(result.totalContributions)}
- Total interest earned: ${formatCurrencyDetailed(result.totalInterest)}`;

    onCalculate({ type: 'savings', summary });
    setTimeout(() => setCalculating(false), 500);
  };

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="rounded-3xl border border-border bg-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Initial deposit</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <input type="number" value={initial} onChange={e => setInitial(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Interest rate (APY %)</label>
            <input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Monthly contribution</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <input type="number" value={monthly} onChange={e => setMonthly(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Time period (years)</label>
            <input type="number" value={years} onChange={e => setYears(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Compounding frequency</label>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {COMPOUND_FREQS.map(f => (
              <button key={f.n} onClick={() => setFreq(f.n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${freq === f.n ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-muted-foreground hover:text-foreground'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleCalculate} disabled={calculating}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Get AI Insights
        </button>
      </div>

      {/* Results */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-2xl bg-surface-2 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Final balance</p>
            <p className="text-base font-bold text-primary mt-1">{formatCurrency(result.finalBalance)}</p>
          </div>
          <div className="rounded-2xl bg-surface-2 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Contributions</p>
            <p className="text-base font-bold text-foreground mt-1">{formatCurrency(result.totalContributions)}</p>
          </div>
          <div className="rounded-2xl bg-surface-2 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Interest earned</p>
            <p className="text-base font-bold text-success mt-1">{formatCurrency(result.totalInterest)}</p>
          </div>
        </div>

        {/* Growth chart */}
        <div className="h-48 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.data}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={35} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                formatter={(v, name) => [formatCurrency(v), name === 'balance' ? 'Balance' : name === 'contributions' ? 'Contributions' : 'Interest']}
              />
              <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#balanceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Milestones */}
      {result.milestones.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Milestone predictions</h3>
          </div>
          <div className="space-y-2">
            {result.milestones.map(m => (
              <div key={m.target} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${m.future ? 'bg-muted' : 'bg-primary/10'}`}>
                    <Target className={`w-3.5 h-3.5 ${m.future ? 'text-muted-foreground' : 'text-primary'}`} />
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(m.target)}</span>
                  {m.future && <span className="text-[9px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">PAST {years}Y</span>}
                </div>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}