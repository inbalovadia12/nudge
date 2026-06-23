import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { goalOptions, getGoalIcon } from '@/lib/nudgeUtils';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const strictnessLevels = [
  { value: 'gentle', label: 'Gentle', desc: 'I\'ll only speak up for big stuff.', preview: 'This looks fine — no concerns from me. Up to you.' },
  { value: 'moderate', label: 'Balanced', desc: 'A steady, honest check.', preview: 'Worth a quick pause. Here\'s what I noticed about this one.' },
  { value: 'strict', label: 'Strict', desc: 'I\'ll be thorough and honest.', preview: 'This would push your goal back about two weeks. Just wanted you to know.' }
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [targetAmount, setTargetAmount] = useState(2000);
  const [strictness, setStrictness] = useState('moderate');
  const [name, setName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleGoalSelect = (goal) => {
    setSelectedGoal(goal);
    setTargetAmount(goal.defaultTarget);
  };

  const handleComplete = async () => {
    setSaving(true);
    const income = parseFloat(monthlyIncome) || 0;
    const monthlySavings = income * 0.2;
    const monthsToTarget = monthlySavings > 0 ? Math.ceil(targetAmount / monthlySavings) : 12;
    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + monthsToTarget);

    const profileData = {
      first_name: name.trim() || 'there',
      monthly_income: income,
      strictness,
      onboarding_complete: true
    };

    const profiles = await base44.entities.UserProfile.list();
    if (profiles.length > 0) {
      await base44.entities.UserProfile.update(profiles[0].id, profileData);
    } else {
      await base44.entities.UserProfile.create(profileData);
    }

    await base44.entities.SavingsGoal.create({
      name: selectedGoal.label,
      target_amount: targetAmount,
      current_amount: 0,
      icon: selectedGoal.icon,
      status: 'active',
      is_primary: true,
      estimated_completion_date: completionDate.toISOString().split('T')[0]
    });

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-surface-3'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-bold text-foreground mb-2">What are you saving for?</h1>
              <p className="text-muted-foreground mb-6">Pick one to start. You can add more later.</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {goalOptions.map(goal => {
                  const Icon = getGoalIcon(goal.icon);
                  const isSelected = selectedGoal?.icon === goal.icon;
                  return (
                    <button
                      key={goal.icon}
                      onClick={() => handleGoalSelect(goal)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-surface-1 hover:border-primary/30'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary/10' : 'bg-surface-2'}`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>{goal.label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedGoal && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                  <div className="flex items-baseline justify-between mb-3">
                    <label className="text-sm text-muted-foreground">Target amount</label>
                    <span className="text-2xl font-bold text-primary">${targetAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range" min="500" max="20000" step="100"
                    value={targetAmount}
                    onChange={e => setTargetAmount(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                </motion.div>
              )}

              <Button
                disabled={!selectedGoal}
                onClick={() => setStep(2)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12"
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-bold text-foreground mb-2">How cautious should I be?</h1>
              <p className="text-muted-foreground mb-6">I'll adjust my nudges based on this.</p>

              <div className="flex gap-2 mb-8">
                {strictnessLevels.map(level => (
                  <button
                    key={level.value}
                    onClick={() => setStrictness(level.value)}
                    className={`flex-1 p-4 rounded-2xl border text-left transition-all ${strictness === level.value ? 'border-primary bg-primary/5' : 'border-border bg-surface-1 hover:border-primary/30'}`}
                  >
                    <p className={`font-semibold text-sm ${strictness === level.value ? 'text-primary' : 'text-foreground'}`}>{level.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{level.desc}</p>
                  </button>
                ))}
              </div>

              <div className="bg-surface-2 border border-border rounded-2xl p-4 mb-8">
                <p className="text-xs text-muted-foreground mb-2">Preview — here's what a nudge looks like:</p>
                <p className="text-sm text-foreground/90 italic">"{strictnessLevels.find(l => l.value === strictness).preview}"</p>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="ghost" className="rounded-xl h-12 px-6 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-bold text-foreground mb-2">One last thing.</h1>
              <p className="text-muted-foreground mb-6">What's your rough monthly take-home? This helps me calibrate.</p>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">What should I call you?</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                    className="w-full bg-surface-1 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Monthly take-home (approximate)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="5,000"
                      className="w-full bg-surface-1 border border-border rounded-xl pl-8 pr-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">No bank login needed. You can connect one later for full accuracy.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="ghost" className="rounded-xl h-12 px-6 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={saving || !monthlyIncome}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12"
                >
                  {saving ? 'Setting up...' : 'Start using Nudge'}
                  {!saving && <Check className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}