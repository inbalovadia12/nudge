import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/nudgeUtils';

const COLORS = ['#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f97316', '#6b7280'];

export default function CategoryBreakdown({ transactions }) {
  const expenses = transactions.filter(t => !t.is_income && t.amount > 0);
  if (expenses.length === 0) return null;

  const categoryTotals = {};
  for (const t of expenses) {
    const cat = t.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
  }

  const data = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      amount: Math.round(amount * 100) / 100,
    }))
    .sort((a, b) => b.amount - a.amount);

  const totalSpent = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Spending by Category</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(totalSpent)} total tracked</p>
        </div>
      </div>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="category"
              width={80}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              formatter={(value) => [formatCurrency(value), 'Spent']}
            />
            <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={18}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}