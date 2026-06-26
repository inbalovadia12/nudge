import { motion } from 'framer-motion';
import { ChevronRight, TrendingDown, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ResultsStep({ name, monthlyIncome, goalLabel, targetAmount, onContinue }) {
  const potentialSavings = Math.round((monthlyIncome || 5000) * 0.12);
  const monthsToGoal = monthlyIncome > 0 ? Math.ceil(targetAmount / (monthlyIncome * 0.2)) : 12;
  const daysSaved = 19;

  const results = [
    { icon: TrendingDown, label: 'potential savings', value: `$${potentialSavings}/mo`, color: 'text-success' },
    { icon: Target, label: `${goalLabel} timeline`, value: `${monthsToGoal} months`, color: 'text-primary' },
    { icon: Sparkles, label: 'days saved with Thryve', value: `${daysSaved} days`, color: 'text-warning' },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-16 h-16 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-5"
      >
        <Sparkles className="w-8 h-8 text-primary" />
      </motion.div>

      <h1 className="text-3xl font-bold text-foreground mb-2">Here's what I found, {name || 'there'}</h1>
      <p className="text-muted-foreground mb-8">Based on what you've told me so far.</p>

      <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
        {results.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface-1"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
              <r.icon className={`w-5 h-5 ${r.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{r.label}</p>
              <p className="text-xl font-bold text-foreground">{r.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Button onClick={onContinue} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12">
        Continue <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </motion.div>
  );
}