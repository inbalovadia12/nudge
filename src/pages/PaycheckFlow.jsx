import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePremiumStatus } from '@/lib/usePremium';
import PaywallCard from '@/components/PaywallCard';
import { ArrowLeft, Play, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const flowData = [
  { label: 'Rent', amount: 1800, color: '#6366F1', percent: 36 },
  { label: 'Subscriptions', amount: 244, color: '#8B5CF6', percent: 5 },
  { label: 'Groceries', amount: 312, color: '#EC4899', percent: 6 },
  { label: 'Dining out', amount: 412, color: '#F59E0B', percent: 8 },
  { label: 'Shopping', amount: 385, color: '#10B981', percent: 8 },
  { label: 'Transport', amount: 180, color: '#06B6D4', percent: 4 },
  { label: 'Bills', amount: 415, color: '#EF4444', percent: 8 },
  { label: 'Kept (savings)', amount: 1252, color: '#00C7D9', percent: 25 },
];

const summaryLines = [
  'You kept 25% of this paycheck.',
  'Subscriptions cost you more than groceries.',
  'You could have saved $180 more.',
];

export default function PaycheckFlow() {
  const { isPremium, profile, loading } = usePremiumStatus();
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [month, setMonth] = useState(0);

  useEffect(() => {
    if (playing && currentStep < flowData.length - 1) {
      const timer = setTimeout(() => setCurrentStep(s => s + 1), 800);
      return () => clearTimeout(timer);
    }
    if (playing && currentStep === flowData.length - 1) {
      const timer = setTimeout(() => setPlaying(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [playing, currentStep]);

  const handlePlay = () => {
    setCurrentStep(-1);
    setPlaying(true);
    setTimeout(() => setCurrentStep(0), 100);
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const trialDays = profile?.premium_trial_end_date
    ? Math.max(0, Math.ceil((new Date(profile.premium_trial_end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Free teaser: show first 5 seconds (first 2 categories) then blur
  const showFull = isPremium || (playing && currentStep < 2);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-6 max-w-2xl mx-auto w-full">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <h1 className="text-2xl font-bold font-heading">Paycheck Flow</h1>
        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => setMonth(Math.max(0, month - 1))} className="p-1 rounded-lg hover:bg-secondary">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium">
            {month === 0 ? 'This month' : month === 1 ? 'Last month' : `${month} months ago`}
          </span>
          <button onClick={() => setMonth(month + 1)} className="p-1 rounded-lg hover:bg-secondary">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Animation area */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className={`w-full max-w-md relative ${!showFull && currentStep >= 2 ? 'blur-md pointer-events-none' : ''}`}>
          {/* Source: Paycheck */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block"
            >
              <div className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💵</span>
              </div>
              <p className="text-xs text-muted-foreground">PAYCHECK</p>
              <p className="text-2xl font-bold font-heading text-primary">$5,000</p>
            </motion.div>
          </div>

          {/* Flowing line */}
          <div className="flex justify-center mb-4">
            <motion.div
              animate={playing ? { height: ['20px', '60px', '20px'] } : {}}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="w-0.5 bg-gradient-to-b from-primary to-transparent"
              style={{ height: '40px' }}
            />
          </div>

          {/* Category containers */}
          <div className="space-y-2.5">
            {flowData.map((cat, i) => {
              const isActive = currentStep >= i;
              const fillPercent = isActive ? cat.percent : 0;
              return (
                <motion.div
                  key={cat.label}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: isActive ? 1 : 0.3 }}
                  className="relative rounded-xl border border-border bg-card overflow-hidden h-12"
                >
                  {/* Fill */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 rounded-xl"
                    style={{ backgroundColor: cat.color, opacity: 0.3 }}
                  />
                  <div className="relative h-full flex items-center justify-between px-4">
                    <span className="text-sm font-medium">{cat.label}</span>
                    <span className="text-sm font-semibold tabular-nums">
                      ${cat.amount.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Summary lines */}
          <AnimatePresence>
            {currentStep >= flowData.length - 1 && showFull && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 space-y-2"
              >
                {summaryLines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.3 }}
                    className="text-sm text-foreground/90 text-center"
                  >
                    {line}
                  </motion.p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 max-w-2xl mx-auto w-full">
        {/* Paywall overlay for free users */}
        {!isPremium && currentStep >= 2 && (
          <div className="mb-4">
            <PaywallCard
              title="Want to see the full flow?"
              description="Watch every dollar find its place. Premium unlocks the complete animation, month comparison, and shareable summary cards."
              trialDays={trialDays}
              onUpgrade={() => {}}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handlePlay}
            disabled={playing}
            className="flex-1 bg-primary text-primary-foreground rounded-2xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {playing ? 'Playing...' : currentStep >= flowData.length - 1 ? (
              <><RotateCcw className="w-4 h-4" /> Replay</>
            ) : (
              <><Play className="w-4 h-4" /> Play flow</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}