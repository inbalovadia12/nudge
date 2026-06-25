import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertTriangle, Check, ArrowRight, Lock, Clock, Brain, Heart, TrendingDown } from 'lucide-react';

// Each answer has a "friction score" from 0 (green light) to 3 (strong red flag)
const questions = [
  {
    id: 'need',
    text: 'What\'s driving you to open this right now?',
    answers: [
      { label: 'I genuinely need to buy something specific', value: 0, icon: 'check' },
      { label: 'I\'m browsing to kill time', value: 3, icon: 'clock' },
      { label: 'I\'m stressed, bored, or emotional', value: 3, icon: 'heart' },
      { label: 'I saw an ad or got a notification', value: 2, icon: 'alert' },
    ],
  },
  {
    id: 'timing',
    text: 'Have you thought about this purchase for more than 10 minutes today?',
    answers: [
      { label: 'Yes, I\'ve been planning this for a while', value: 0, icon: 'check' },
      { label: 'I thought about it earlier today', value: 1, icon: 'check' },
      { label: 'It just popped into my head', value: 3, icon: 'alert' },
      { label: 'I\'m not even sure what I want to buy', value: 3, icon: 'heart' },
    ],
  },
  {
    id: 'goal',
    text: 'How does this fit with what you\'re saving for?',
    answers: [
      { label: 'It doesn\'t affect my savings goal', value: 0, icon: 'check' },
      { label: 'It\'s a small dent, I can recover', value: 1, icon: 'check' },
      { label: 'It pushes my goal back a bit', value: 2, icon: 'alert' },
      { label: 'I don\'t have a savings goal', value: 2, icon: 'trending' },
    ],
  },
  {
    id: 'alternatives',
    text: 'Have you checked if you already own something that does the job?',
    answers: [
      { label: 'Yes, and I don\'t have anything like this', value: 0, icon: 'check' },
      { label: 'I think I might, but haven\'t looked', value: 2, icon: 'alert' },
      { label: 'Probably, but I want the new one', value: 3, icon: 'heart' },
      { label: 'No, and I don\'t care to check', value: 3, icon: 'alert' },
    ],
  },
  {
    id: 'trigger',
    text: 'Be honest — is something else going on right now?',
    answers: [
      { label: 'Nothing, just a normal day', value: 0, icon: 'check' },
      { label: 'I\'m a little restless', value: 1, icon: 'check' },
      { label: 'I\'m stressed or anxious', value: 3, icon: 'heart' },
      { label: 'I\'m rewarding myself for a bad day', value: 3, icon: 'heart' },
    ],
  },
  {
    id: 'regret',
    text: 'Think about a purchase you regretted recently. How is this different?',
    answers: [
      { label: 'This is different — I\'ve done my homework', value: 0, icon: 'check' },
      { label: 'It\'s similar, but I think this one\'s worth it', value: 1, icon: 'check' },
      { label: 'Honestly, it feels the same', value: 3, icon: 'alert' },
      { label: 'I don\'t have any recent regrets', value: 1, icon: 'check' },
    ],
  },
  {
    id: 'future',
    text: 'Fast forward 30 days. How will you feel about opening this today?',
    answers: [
      { label: 'Glad I did it — it was worth it', value: 0, icon: 'check' },
      { label: 'Neutral, it was just a normal purchase', value: 1, icon: 'check' },
      { label: 'I\'ll probably have forgotten about it', value: 2, icon: 'alert' },
      { label: 'I can already feel the regret coming', value: 3, icon: 'heart' },
    ],
  },
];

const iconMap = {
  check: { Icon: Check, bg: 'bg-success/10', color: 'text-success' },
  alert: { Icon: AlertTriangle, bg: 'bg-warning/10', color: 'text-warning' },
  heart: { Icon: Heart, bg: 'bg-danger/10', color: 'text-danger' },
  clock: { Icon: Clock, bg: 'bg-warning/10', color: 'text-warning' },
  trending: { Icon: TrendingDown, bg: 'bg-warning/10', color: 'text-warning' },
};

// Results based on total friction score
function getResult(totalScore, maxScore) {
  const pct = totalScore / maxScore;

  if (pct <= 0.15) {
    return {
      tier: 'green',
      icon: Check,
      iconBg: 'bg-success/15',
      iconColor: 'text-success',
      title: 'You\'ve thought this through',
      message: 'Your answers show intention and awareness. This looks like a mindful choice — go ahead if it feels right.',
      primaryAction: 'proceed',
      primaryLabel: `Proceed to app`,
    };
  }

  if (pct <= 0.35) {
    return {
      tier: 'lime',
      icon: Check,
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
      title: 'Looks reasonable — just stay aware',
      message: 'Nothing alarming, but a couple of your answers suggest you\'re not fully certain. If you proceed, set a spending limit before you start browsing.',
      primaryAction: 'proceed',
      primaryLabel: `Proceed with a spending limit`,
    };
  }

  if (pct <= 0.55) {
    return {
      tier: 'amber',
      icon: Clock,
      iconBg: 'bg-warning/15',
      iconColor: 'text-warning',
      title: 'Sleep on it',
      message: 'A few of your answers hint that this might be impulse-driven. Give it 24 hours — if you still want it tomorrow, it\'s probably a real need, not a moment.',
      primaryAction: 'back',
      primaryLabel: 'Set a 24-hour reminder',
      secondaryAction: 'proceed',
      secondaryLabel: 'I\'ll proceed anyway',
    };
  }

  if (pct <= 0.75) {
    return {
      tier: 'orange',
      icon: Brain,
      iconBg: 'bg-warning/15',
      iconColor: 'text-warning',
      title: 'This feels emotional',
      message: 'Your answers suggest something deeper is driving this — stress, boredom, or a need for a reward. Those are the moments spending tends to sting later. Take a walk, text a friend, then revisit.',
      primaryAction: 'back',
      primaryLabel: 'Not right now',
      secondaryAction: 'proceed',
      secondaryLabel: 'I understand, let me through',
    };
  }

  return {
    tier: 'red',
    icon: Shield,
    iconBg: 'bg-danger/15',
    iconColor: 'text-danger',
    title: 'Your future self is asking you to stop',
    message: 'Almost every answer points to this being an impulse purchase you\'re likely to regret. The strongest move you can make right now is closing this and doing something else. Seriously.',
    primaryAction: 'back',
    primaryLabel: 'Close and walk away',
    secondaryAction: 'proceed',
    secondaryLabel: 'I insist on proceeding',
  };
}

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

  const totalScore = answers.reduce((sum, a) => sum + a, 0);
  const maxScore = questions.length * 3;
  const result = getResult(totalScore, maxScore);
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
        className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
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

              <div className="space-y-2.5">
                {q.answers.map((a, i) => {
                  const { Icon, bg, color } = iconMap[a.icon];
                  return (
                    <button
                      key={i}
                      onClick={() => answer(a.value)}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className={`w-16 h-16 rounded-3xl ${result.iconBg} flex items-center justify-center mx-auto mb-4`}>
                <result.icon className={`w-8 h-8 ${result.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{result.title}</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{result.message}</p>

              <div className="space-y-2">
                {result.primaryAction === 'proceed' ? (
                  <>
                    <button
                      onClick={onProceed}
                      className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                      {result.primaryLabel} <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onBack}
                      className="w-full p-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                    >
                      Maybe not
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onBack}
                      className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                      {result.primaryLabel} <ArrowRight className="w-4 h-4" />
                    </button>
                    {result.secondaryAction === 'proceed' && (
                      <button
                        onClick={onProceed}
                        className="w-full p-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                      >
                        {result.secondaryLabel}
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}