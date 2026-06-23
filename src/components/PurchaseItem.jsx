import { CATEGORY_ICONS, formatCurrency } from '@/lib/nudge-utils';
import moment from 'moment';

export default function PurchaseItem({ purchase }) {
  const Icon = CATEGORY_ICONS[purchase.category] || CATEGORY_ICONS.other;
  const date = purchase.purchase_date || purchase.created_date;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
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