import { motion } from 'framer-motion';

export default function DataMaturityBar({ weeksIn = 2, label }) {
  const totalWeeks = 8;
  const progress = Math.min(weeksIn / totalWeeks, 1) * 100;
  const stage = weeksIn < 2 ? 'early' : weeksIn < 4 ? 'building' : 'rich';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground">BUILDING YOUR PROFILE</span>
        <span className="text-xs text-muted-foreground">{weeksIn} of 8 weeks</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-primary rounded-full"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        {label || 'Nudigo is learning your patterns. More insights unlock as your history grows.'}
      </p>
    </motion.div>
  );
}