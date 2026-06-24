import { motion } from 'framer-motion';
import { Moon, Calendar, TrendingUp, ShoppingBag } from 'lucide-react';

const patternIcons = {
  weekend_spike: Calendar,
  payday_clustering: TrendingUp,
  late_night: Moon,
  category_dominance: ShoppingBag,
  frequency_pattern: TrendingUp,
  emotional_spending: ShoppingBag,
};

export default function HabitCard({ habit, index = 0, isLocked = false }) {
  const Icon = patternIcons[habit.pattern_type] || TrendingUp;

  if (isLocked) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-5 relative overflow-hidden">
        <div className="filter blur-sm pointer-events-none select-none">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{habit.title}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{habit.description}</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-card/40">
          <span className="text-xs font-semibold text-muted-foreground">Premium insight</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground leading-snug">{habit.title}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pl-12">{habit.description}</p>
    </motion.div>
  );
}