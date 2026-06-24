import { AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/nudgeUtils';

export default function BillItem({ bill }) {
  const isOverdrawn = bill.predicted_balance_after < 0;
  const isLow = bill.predicted_balance_after >= 0 && bill.predicted_balance_after < 50;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverdrawn ? 'bg-danger' : isLow ? 'bg-warning' : 'bg-muted-foreground/30'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{bill.name}</p>
        <p className="text-xs text-muted-foreground">{formatDate(bill.due_date)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">{formatCurrency(bill.amount)}</p>
        {isOverdrawn && (
          <p className="text-[10px] text-danger flex items-center gap-0.5 justify-end">
            <AlertTriangle className="w-2.5 h-2.5" />
            Overdraft risk
          </p>
        )}
        {isLow && (
          <p className="text-[10px] text-warning">
            Balance: {formatCurrency(bill.predicted_balance_after)}
          </p>
        )}
      </div>
    </div>
  );
}