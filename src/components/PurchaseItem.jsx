import { CATEGORY_ICONS, formatCurrency } from '@/lib/nudge-utils';
import moment from 'moment';

const CATEGORY_COLORS = {
  dining: 'bg-orange-500/12 text-orange-400',
  shopping: 'bg-pink-500/12 text-pink-400',
  entertainment: 'bg-violet-500/12 text-violet-400',
  transport: 'bg-blue-500/12 text-blue-400',
  groceries: 'bg-emerald-500/12 text-emerald-400',
  bills: 'bg-red-500/12 text-red-400',
  health: 'bg-teal-500/12 text-teal-400',
  travel: 'bg-cyan-500/12 text-cyan-400',
  tech: 'bg-indigo-500/12 text-indigo-400',
  other: 'bg-secondary text-muted-foreground',
};

export default function PurchaseItem({ purchase }) {
  const Icon = CATEGORY_ICONS[purchase.category] || CATEGORY_ICONS.other;
  const date = purchase.purchase_date || purchase.created_date;
  const colorClass = CATEGORY_COLORS[purchase.category] || CATEGORY_COLORS.other;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{purchase.merchant}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {purchase.category} · {moment(date).format('MMM D')}
        </p>
      </div>
      <p className="text-sm font-semibold tabular-nums">
        {formatCurrency(purchase.amount)}
      </p>
    </div>
  );
}