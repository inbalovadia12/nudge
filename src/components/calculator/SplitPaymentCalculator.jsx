import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { base44 } from '@/api/base44Client';
import { formatCurrency, formatCurrencyDetailed } from '@/lib/nudgeUtils';
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, Calendar, TrendingDown } from 'lucide-react';

const SCHEDULES = [
  { label: 'Monthly', periods: 12 },
  { label: 'Bi-weekly', periods: 26 },
  { label: 'Weekly', periods: 52 },
];

export default function SplitPaymentCalculator({ onCalculate, lastCalc }) {
  const [price, setPrice] = useState(800);
  const [installments, setInstallments] = useState(4);
  const [feeRate, setFeeRate] = useState(15);
  const [schedule, setSchedule] = useState(12);
  const [calculating, setCalculating] = useState(false);
  const [goalDelay, setGoalDelay] = useState(null);

  // Fetch user's primary goal to calculate delay
  useEffect(() => {
    base44.entities.SavingsGoal.filter({ status: 'active' })
      .then(goals => {
        const primary = goals.find(g => g.is_primary) || goals[0];
        if (primary) {
          const remaining = primary.target_amount - (primary.current_amount || 0);
          setGoalDelay({ goalName: primary.name, remaining });
        }
      })
      .catch(() => {});
  }, []);

  const result = useMemo(() => {
    const P = Number(price) || 0;
    const n = Number(installments) || 1;
    const feePct = (Number(feeRate) || 0) / 100;
    const totalPaid = P * (1 + feePct);
    const extraCost = totalPaid - P;
    const paymentPerInstallment = totalPaid / n;
    const effectiveInterest = P > 0 ? (extraCost / P) * 100 : 0;

    // Goal delay: if user saves ~$200/mo, how many days does extraCost delay?
    const monthlySavings = 200;
    const delayMonths = extraCost > 0 ? extraCost / monthlySavings : 0;
    const delayDays = Math.round(delayMonths * 30);

    const isBeneficial = feePct <= 0;

    return { totalPaid, extraCost, paymentPerInstallment, effectiveInterest, delayDays, isBeneficial };
  }, [price, installments, feeRate]);

  const chartData = [
    { name: 'One-time', amount: Number(price) || 0, fill: 'hsl(var(--primary))' },
    { name: 'Split payments', amount: result.totalPaid, fill: result.isBeneficial ? 'hsl(var(--success))' : 'hsl(var(--danger))' },
  ];

  const handleCalculate = () => {
    setCalculating(true);
    const summary = `Split Payment vs One-Time Calculator:
- Product price: ${formatCurrencyDetailed(price)}
- Installments: ${installments}
- Financing fee/interest: ${feeRate}%
- Payment schedule: ${SCHEDULES.find(s => s.periods === schedule)?.label || 'Monthly'}
- Total with installments: ${formatCurrencyDetailed(result.totalPaid)}
- Extra cost: ${formatCurrencyDetailed(result.extraCost)}
- Effective interest: ${result.effectiveInterest.toFixed(1)}%
- Per installment: ${formatCurrencyDetailed(result.paymentPerInstallment)}
- Estimated goal delay: ${result.delayDays} days
${goalDelay ? `User's primary goal: "${goalDelay.goalName}", $${goalDelay.remaining} remaining to target` : ''}`;

    onCalculate({ type: 'split', summary });
    setTimeout(() => setCalculating(false), 500);
  };

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="rounded-3xl border border-border bg-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Product price</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Installments</label>
            <input type="number" value={installments} onChange={e => setInstallments(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Financing fee / interest (%)</label>
            <input type="number" step="0.1" value={feeRate} onChange={e => setFeeRate(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payment schedule</label>
            <select value={schedule} onChange={e => setSchedule(Number(e.target.value))}
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-primary">
              {SCHEDULES.map(s => <option key={s.periods} value={s.periods}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleCalculate} disabled={calculating}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Get AI Insights
        </button>
      </div>

      {/* Verdict banner */}
      <div className={`rounded-3xl border p-5 ${result.isBeneficial ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}>
        <div className="flex items-center gap-3">
          {result.isBeneficial ? <CheckCircle2 className="w-6 h-6 text-success" /> : <AlertTriangle className="w-6 h-6 text-danger" />}
          <div>
            <p className="text-sm font-bold">{result.isBeneficial ? 'Splitting is free' : `You'll pay ${formatCurrency(result.extraCost)} extra`}</p>
            <p className="text-xs text-muted-foreground">{result.effectiveInterest.toFixed(1)}% effective interest · {formatCurrencyDetailed(result.paymentPerInstallment)}/installment</p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-surface-2 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total with installments</p>
            <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(result.totalPaid)}</p>
          </div>
          <div className="rounded-2xl bg-surface-2 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Extra cost</p>
            <p className={`text-lg font-bold mt-1 ${result.extraCost > 0 ? 'text-danger' : 'text-success'}`}>{formatCurrency(result.extraCost)}</p>
          </div>
        </div>

        {/* Comparison chart */}
        <div className="h-44 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} width={40} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--surface-2))' }}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                formatter={v => [formatCurrency(v), 'Amount']}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={60}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goal impact */}
      {result.delayDays > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-danger" />
            <h3 className="text-sm font-semibold">Goal impact</h3>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3">
            <Calendar className="w-5 h-5 text-danger flex-shrink-0" />
            <p className="text-sm text-foreground">
              This purchase <span className="font-bold text-danger">delays your savings goal by ~{result.delayDays} days</span>
              {goalDelay ? ` (pushes "${goalDelay.goalName}" back)` : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}