import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, FileSpreadsheet, PenLine, Landmark } from 'lucide-react';
import { formatCurrency } from '@/lib/nudgeUtils';

const SOURCE_LABELS = {
  csv: { label: 'CSV', icon: FileSpreadsheet },
  manual: { label: 'Manual', icon: PenLine },
  plaid: { label: 'Plaid', icon: Landmark },
};

const CATEGORY_COLORS = {
  dining: 'bg-orange-500/10 text-orange-500',
  shopping: 'bg-purple-500/10 text-purple-500',
  entertainment: 'bg-pink-500/10 text-pink-500',
  groceries: 'bg-green-500/10 text-green-500',
  transport: 'bg-blue-500/10 text-blue-500',
  bills: 'bg-red-500/10 text-red-500',
  health: 'bg-teal-500/10 text-teal-500',
  travel: 'bg-indigo-500/10 text-indigo-500',
  tech: 'bg-cyan-500/10 text-cyan-500',
  income: 'bg-success/10 text-success',
  other: 'bg-muted text-muted-foreground',
};

export default function TransactionItem({ transaction, onDelete }) {
  if (!transaction) return null;
  const isIncome = transaction.is_income || transaction.amount < 0;
  const source = SOURCE_LABELS[transaction.source] || SOURCE_LABELS.manual;
  const SourceIcon = source.icon;
  const catColor = CATEGORY_COLORS[transaction.category] || CATEGORY_COLORS.other;
  const displayAmount = Math.abs(transaction.amount);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2.5"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-success/10' : 'bg-primary/10'}`}>
        {isIncome ? <ArrowDownLeft className="w-4 h-4 text-success" /> : <ArrowUpRight className="w-4 h-4 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {transaction.normalized_merchant || transaction.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{transaction.date}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${catColor}`}>
            {transaction.category}
          </span>
          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
            <SourceIcon className="w-2.5 h-2.5" /> {source.label}
          </span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-semibold ${isIncome ? 'text-success' : 'text-foreground'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(displayAmount)}
        </p>
        {onDelete && (
          <button
            onClick={() => onDelete(transaction)}
            className="text-[10px] text-muted-foreground/40 hover:text-danger transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </motion.div>
  );
}