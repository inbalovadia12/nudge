import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertTriangle, Check, ArrowRight, Lock } from 'lucide-react';

const questions = [
  {
    id: 'need',
    text: 'Do you really need this right now?',
    yesLabel: 'Yes, I need it',
    noLabel: 'Not really',
  },
  {
    id: 'goal',
    text: 'Does this align with your savings goal?',
    yesLabel: 'Yes, it fits',
    noLabel: 'Not really',
  },
  {
    id: 'wait',
    text: 'Could this wait until tomorrow?',
    yesLabel: 'It can wait',
    noLabel: 'It\'s urgent',
  },
  {
    id: 'similar',
    text: 'Have you checked if you already own something similar?',
    yesLabel: 'I checked',
    noLabel: 'Not yet',
  },
  {
    id: 'regret',
    text: 'How will you feel about this purchase tomorrow?',
    yesLabel: 'Good about it',
    noLabel: 'Might regret it',
  },
];

export default function InterceptionQuestions({ appName, appUrl, onProceed, onBack }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);

  function answer(value) {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setShowResult(true);
    }
  }

  // Count "negative" answers (ones that suggest not proceeding)
  const negativeCount = answers.filter(a => a === 'no').length;
  const shouldProceed = negativeCount <= 2;

  const q = questions[currentQ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Shopping Shield</p>
            <p className="text-sm font-semibold text-foreground">Opening {appName}</p>
          </div>
          <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key={`q-${currentQ}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Progress */}
              <div className="flex items-center gap-1.5 mb-5">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${i <= currentQ ? 'bg-primary' : 'bg-surface-3'}`}
                  />
                ))}
              </div>

              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Question {currentQ + 1} of {questions.length}
              </p>
              <h3 className="text-lg font-semibold text-foreground mb-6">{q.text}</h3>

              <div className="space-y-3">
                <button
                  onClick={() => answer('yes')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{q.yesLabel}</span>
                </button>
                <button
                  onClick={() => answer('no')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-warning/30 hover:bg-warning/5 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{q.noLabel}</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              {shouldProceed ? (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-success/15 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Looks reasonable</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Your answers suggest this is a thoughtful purchase. Go ahead if it feels right.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={onProceed}
                      className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                      Proceed to {appName} <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onBack}
                      className="w-full p-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                    >
                      Maybe not
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-warning/15 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-warning" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Maybe pause on this one</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {negativeCount} of {questions.length} answers suggest this might not be the best move right now. Your future self might thank you for waiting.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={onBack}
                      className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                      Back away <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onProceed}
                      className="w-full p-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                    >
                      I understand, proceed anyway
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}