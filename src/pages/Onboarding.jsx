import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { goalOptions, getGoalIcon } from '@/lib/nudgeUtils';
import { ChevronRight, ChevronLeft, Check, Sparkles, Zap, Shield, ArrowRight, TrendingUp, CalendarDays, Crown } from 'lucide-react';
import SpendingCategoriesStep from '@/components/onboarding/SpendingCategoriesStep';
import ConnectAccountsStep from '@/components/onboarding/ConnectAccountsStep';
import AnalysisStep from '@/components/onboarding/AnalysisStep';
import ResultsStep from '@/components/onboarding/ResultsStep';

export default function Onboarding() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [targetAmount, setTargetAmount] = useState(2000);
  const [spendingCategories, setSpendingCategories] = useState([]);
  const [strictness, setStrictness] = useState('moderate');
  const [name, setName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [connections, setConnections] = useState({ apple_screen_time: false, credit_card: false, bank: false });
  const [saving, setSaving] = useState(false);
  const [goPro, setGoPro] = useState(false);

  const strictnessLevels = [
    { value: 'gentle', label: t('profile.gentle'), desc: t('onboarding.gentleDesc'), preview: t('onboarding.gentleDesc') },
    { value: 'moderate', label: t('profile.balanced'), desc: t('onboarding.balancedDesc'), preview: t('onboarding.balancedDesc') },
    { value: 'strict', label: t('profile.strict'), desc: t('onboarding.strictDesc'), preview: t('onboarding.strictDesc') }
  ];

  const proFeatures = [
    { icon: Zap, title: t('onboarding.proUnlimited'), desc: t('onboarding.proUnlimitedDesc') },
    { icon: Sparkles, title: t('onboarding.proInsights'), desc: t('onboarding.proInsightsDesc') },
    { icon: Shield, title: t('onboarding.proSecurity'), desc: t('onboarding.proSecurityDesc') },
    { icon: TrendingUp, title: t('onboarding.proSimulator'), desc: t('onboarding.proSimulatorDesc') },
    { icon: CalendarDays, title: t('onboarding.proHeatmap'), desc: t('onboarding.proHeatmapDesc') },
    { icon: Crown, title: t('onboarding.proDeals'), desc: t('onboarding.proDealsDesc') },
  ];

  const handleGoalSelect = (goal) => {
    setSelectedGoal(goal);
    setTargetAmount(goal.defaultTarget);
  };

  const toggleCategory = (id) => {
    setSpendingCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleConnection = (id) => {
    setConnections(prev => ({ ...prev, [id]: !prev[id] }));
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
      onboarding_complete: true,
      spending_categories: spendingCategories,
      connected_apple_screen_time: connections.apple_screen_time,
      connected_credit_card: connections.credit_card,
      connected_bank: connections.bank
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

    window.location.href = goPro ? '/pricing' : '/';
  };

  const progressSteps = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {step > 0 && step < 8 && (
          <div className="flex items-center gap-2 mb-8">
            {progressSteps.map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-surface-3'}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 0 — Welcome */}
          {step === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }} className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </motion.div>
              <h1 className="text-4xl font-bold text-foreground mb-3">{t('onboarding.meetNudigo')}</h1>
              <p className="text-foreground text-lg mb-2 leading-relaxed">{t('onboarding.buildHabits')}</p>
              <p className="text-muted-foreground/70 mb-10 leading-relaxed max-w-sm mx-auto">
                {t('onboarding.intro')}
              </p>
              <div className="space-y-3 mb-10 text-left max-w-sm mx-auto">
                {[{ icon: Check, text: t('onboarding.verdict10s') }, { icon: Check, text: t('onboarding.trackGoals') }, { icon: Check, text: t('onboarding.calmAssistant') }].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0"><item.icon className="w-3 h-3 text-primary" /></div>
                    <span className="text-sm text-foreground/90">{item.text}</span>
                  </motion.div>
                ))}
              </div>
              <Button onClick={() => setStep(1)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12 text-base">{t('onboarding.getStarted')} <ArrowRight className="w-4 h-4 ml-1" /></Button>
              <p className="text-xs text-muted-foreground/60 mt-4">{t('onboarding.takesTime')}</p>
            </motion.div>
          )}

          {/* Step 1 — Goal */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-bold text-foreground mb-2">{t('onboarding.savingFor')}</h1>
              <p className="text-muted-foreground mb-6">{t('onboarding.pickOne')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {goalOptions.map(goal => {
                  const Icon = getGoalIcon(goal.icon);
                  const isSelected = selectedGoal?.icon === goal.icon;
                  return (
                    <button key={goal.icon} onClick={() => handleGoalSelect(goal)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-surface-1 hover:border-primary/30'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary/10' : 'bg-surface-2'}`}><Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} /></div>
                      <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>{goal.label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedGoal && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                  <div className="flex items-baseline justify-between mb-3"><label className="text-sm text-muted-foreground">{t('onboarding.targetAmount')}</label><span className="text-2xl font-bold text-primary">${targetAmount.toLocaleString()}</span></div>
                  <input type="range" min="500" max="20000" step="100" value={targetAmount} onChange={e => setTargetAmount(parseInt(e.target.value))} className="w-full accent-primary" />
                </motion.div>
              )}
              <Button disabled={!selectedGoal} onClick={() => setStep(2)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12">{t('common.continue')} <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </motion.div>
          )}

          {/* Step 2 — Spending categories */}
          {step === 2 && (
            <SpendingCategoriesStep key="step2" selected={spendingCategories} onToggle={toggleCategory} onBack={() => setStep(1)} onContinue={() => setStep(3)} />
          )}

          {/* Step 3 — Strictness */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-bold text-foreground mb-2">{t('onboarding.howCautious')}</h1>
              <p className="text-muted-foreground mb-6">{t('onboarding.adjustGuidance')}</p>
              <div className="flex gap-2 mb-8">
                {strictnessLevels.map(level => (
                  <button key={level.value} onClick={() => setStrictness(level.value)} className={`flex-1 p-4 rounded-2xl border text-left transition-all ${strictness === level.value ? 'border-primary bg-primary/5' : 'border-border bg-surface-1 hover:border-primary/30'}`}>
                    <p className={`font-semibold text-sm ${strictness === level.value ? 'text-primary' : 'text-foreground'}`}>{level.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{level.desc}</p>
                  </button>
                ))}
              </div>
              <div className="bg-surface-2 border border-border rounded-2xl p-4 mb-8">
                <p className="text-xs text-muted-foreground mb-2">{t('onboarding.preview')}</p>
                <p className="text-sm text-foreground/90 italic">"{strictnessLevels.find(l => l.value === strictness).preview}"</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="ghost" className="rounded-xl h-12 px-6 text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" /> {t('common.back')}</Button>
                <Button onClick={() => setStep(4)} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12">{t('common.continue')} <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </motion.div>
          )}

          {/* Step 4 — Name + income */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-bold text-foreground mb-2">{t('onboarding.oneLastThing')}</h1>
              <p className="text-muted-foreground mb-6">{t('onboarding.calibrate')}</p>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">{t('onboarding.callYou')}</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('onboarding.yourName')} className="w-full bg-surface-1 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary text-sm" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">{t('onboarding.monthlyTakeHome')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="5,000" className="w-full bg-surface-1 border border-border rounded-xl pl-8 pr-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary text-sm" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{t('onboarding.noBankNeeded')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(3)} variant="ghost" className="rounded-xl h-12 px-6 text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" /> {t('common.back')}</Button>
                <Button onClick={() => setStep(5)} disabled={!monthlyIncome} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12">{t('common.continue')} <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </motion.div>
          )}

          {/* Step 5 — Connect accounts */}
          {step === 5 && (
            <ConnectAccountsStep key="step5" connections={connections} onToggle={toggleConnection} onBack={() => setStep(4)} onContinue={() => setStep(6)} />
          )}

          {/* Step 6 — AI Analysis */}
          {step === 6 && (
            <AnalysisStep key="step6" onDone={() => setStep(7)} />
          )}

          {/* Step 7 — Results */}
          {step === 7 && (
            <ResultsStep key="step7" name={name} monthlyIncome={parseFloat(monthlyIncome) || 0} goalLabel={selectedGoal?.label || 'Goal'} targetAmount={targetAmount} onContinue={() => setStep(8)} />
          )}

          {/* Step 8 — Pro upsell */}
          {step === 8 && (
            <motion.div key="step8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4"><Zap className="w-7 h-7 text-primary" /></div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{t('onboarding.goPremium')}</h1>
                <p className="text-muted-foreground">{t('onboarding.unlockFull')}</p>
              </div>
              <div className="space-y-3 mb-8">
                {proFeatures.map((feature, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${goPro ? 'border-primary/30 bg-primary/5' : 'border-border bg-surface-1'}`}>
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><feature.icon className="w-4 h-4 text-primary" /></div>
                    <div><p className="text-sm font-medium text-foreground">{feature.title}</p><p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p></div>
                  </motion.div>
                ))}
              </div>
              <div className={`rounded-2xl border-2 p-5 mb-4 cursor-pointer transition-all ${goPro ? 'border-primary bg-primary/5' : 'border-border bg-surface-1'}`} onClick={() => setGoPro(!goPro)}>
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold text-foreground">{t('profile.nudigoPremium')}</p><p className="text-xs text-muted-foreground">{t('onboarding.monthlySubscription')}</p></div>
                  <div className="text-right"><p className="text-2xl font-bold text-primary">$6.99</p><p className="text-xs text-muted-foreground">/{t('common.month')}</p></div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(7)} variant="ghost" className="rounded-xl h-12 px-6 text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" /> {t('common.back')}</Button>
                <Button onClick={handleComplete} disabled={saving} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12">
                  {saving ? t('onboarding.settingUp') : goPro ? t('onboarding.goPremium') : t('onboarding.startFree')}{!saving && <Check className="w-4 h-4 ml-1" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/60 text-center mt-4">{t('onboarding.upgradeAnytime')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}