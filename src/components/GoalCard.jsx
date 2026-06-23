import SavingsRing from '@/components/SavingsRing';
import { getGoalIcon, formatCurrency, formatDateLong } from '@/lib/nudgeUtils';

export default function GoalCard({ goal, compact = false }) {
  const Icon = getGoalIcon(goal.icon);
  const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;

  if (compact) {
    return (
      <div className="bg-surface-1 border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{goal.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
          </p>
        </div>
        <span className="text-lg font-bold text-primary">{Math.round(progress)}%</span>
      </div>
    );
  }

  return (
    <div className="bg-surface-1 border border-border rounded-3xl p-6 hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{goal.name}</h3>
            {goal.is_primary && (
              <span className="text-xs text-primary">Primary goal</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center py-4">
        <SavingsRing progress={progress} size={130} sublabel="there" />
      </div>

      <div className="flex items-baseline justify-between mb-1">
        <span className="text-2xl font-bold text-foreground">
          {formatCurrency(goal.current_amount)}
        </span>
        <span className="text-sm text-muted-foreground">
          of {formatCurrency(goal.target_amount)}
        </span>
      </div>

      {goal.estimated_completion_date && (
        <p className="text-sm text-muted-foreground">
          On track for {formatDateLong(goal.estimated_completion_date)}
        </p>
      )}
    </div>
  );
}