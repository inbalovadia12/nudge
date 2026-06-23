import { motion } from 'framer-motion';

export default function SavingsRing({
  progress = 0,
  size = 140,
  strokeWidth = 10,
  showLabel = true,
  sublabel = null,
  glowOnHover = true
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;
  const isComplete = clampedProgress >= 100;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${glowOnHover ? 'transition-all duration-300 hover:drop-shadow-[0_0_12px_hsl(186_100%_43%/0.4)]' : ''}`}
      style={{ width: size, height: size }}
    >
      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-full h-full rounded-full bg-primary/20 animate-ring-burst" />
        </div>
      )}
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(240 8% 16%)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
          style={{ filter: 'drop-shadow(0 0 6px hsl(186 100% 43% / 0.35))' }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00C7D9" />
            <stop offset="100%" stopColor="#008B99" />
          </linearGradient>
        </defs>
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-bold text-foreground"
            style={{ fontSize: size * 0.22 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {Math.round(clampedProgress)}%
          </motion.span>
          {sublabel && (
            <span className="text-xs text-muted-foreground mt-0.5">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}