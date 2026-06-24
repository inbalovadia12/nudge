import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export default function HealthScoreRing({ score, change, primaryReason }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const isDown = change < 0;
  const TrendIcon = isDown ? TrendingDown : change > 0 ? TrendingUp : Minus;

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <motion.circle
              cx="60" cy="60" r={radius} fill="none"
              stroke={score >= 70 ? 'hsl(var(--success))' : score >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-heading">{score}</span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-semibold text-muted-foreground">FINANCIAL HEALTH</span>
            {change !== 0 && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${isDown ? 'text-danger' : 'text-success'}`}>
                <TrendIcon className="w-3 h-3" />
                {Math.abs(change)} pts
              </span>
            )}
          </div>
          {primaryReason && (
            <p className="text-sm text-foreground/80 leading-relaxed">{primaryReason}</p>
          )}
        </div>
      </div>
    </div>
  );
}