import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const messages = [
  'Finding subscriptions…',
  'Learning spending habits…',
  'Finding saving opportunities…',
  'Predicting purchase behavior…',
];

export default function AnalysisStep({ onDone }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => {
        if (prev >= messages.length - 1) {
          clearInterval(interval);
          setTimeout(onDone, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1100);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="text-center py-12"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-8"
      >
        <Sparkles className="w-8 h-8 text-primary" />
      </motion.div>

      <div className="h-7 mb-8">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-lg font-medium text-foreground"
          >
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex gap-1.5 justify-center">
        {messages.map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i <= index ? 1 : 0.6, opacity: i <= index ? 1 : 0.3 }}
            className="w-2 h-2 rounded-full bg-primary"
          />
        ))}
      </div>
    </motion.div>
  );
}