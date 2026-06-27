import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, HelpCircle, ExternalLink, Lock, Crown, Puzzle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DownloadStep from '@/components/shield/extension/DownloadStep';
import ExtractStep from '@/components/shield/extension/ExtractStep';
import ExtensionsStep from '@/components/shield/extension/ExtensionsStep';
import DevModeStep from '@/components/shield/extension/DevModeStep';
import LoadStep from '@/components/shield/extension/LoadStep';
import PinStep from '@/components/shield/extension/PinStep';
import CompleteStep from '@/components/shield/extension/CompleteStep';
import HelpModal from '@/components/shield/extension/HelpModal';

const TOTAL_STEPS = 8;
const STORAGE_KEY = 'nudigo_ext_guide_step_v2';

export default function ChromeExtensionGuide({ isPremium, onUpgrade }) {
  const [step, setStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('idle');
  const [downloadUrl, setDownloadUrl] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const s = parseInt(saved, 10);
      if (!isNaN(s) && s >= 0 && s < TOTAL_STEPS) setStep(s);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(step));
  }, [step]);

  async function handleDownload() {
    setDownloadStatus('verifying');
    try {
      const res = await base44.functions.invoke('extension-download', {});
      setDownloadUrl(res.data.download_url);
      setDownloadStatus('success');
      window.open(res.data.download_url, '_blank');
    } catch (err) {
      if (err?.response?.status === 403) {
        setDownloadStatus('locked');
      } else {
        setDownloadStatus('idle');
      }
    }
  }

  if (!isPremium || downloadStatus === 'locked') {
    return (
      <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-card p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Crown className="w-4 h-4 text-warning" />
          <span className="text-xs font-bold uppercase tracking-wide text-warning">Premium Feature</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Chrome Extension</h3>
        <p className="text-sm font-semibold text-foreground mb-1">Available for Plus and Pro users only.</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
          Shopping Shield, price tracking, and purchase protection require a premium plan.
        </p>
        <button onClick={onUpgrade} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
          <Crown className="w-4 h-4" /> Upgrade to Plus
        </button>
      </div>
    );
  }

  const isLastStep = step === TOTAL_STEPS - 1;

  function renderStepContent() {
    switch (step) {
      case 0:
      case 1:
        return <DownloadStep step={step} downloadStatus={downloadStatus} onDownload={handleDownload} downloadUrl={downloadUrl} />;
      case 2:
        return <ExtractStep />;
      case 3:
        return <ExtensionsStep />;
      case 4:
        return <DevModeStep />;
      case 5:
        return <LoadStep />;
      case 6:
        return <PinStep />;
      case 7:
        return <CompleteStep />;
      default:
        return null;
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Puzzle className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">Chrome Extension</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground mb-2">Install the Nudigo Chrome Extension</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Unlock Shopping Shield, website blocking, price tracking, purchase reminders, and intelligent spending interventions directly in Chrome.
        </p>
      </div>

      <div className="px-6 sm:px-8 pt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">Step {step + 1} of {TOTAL_STEPS}</span>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary w-6' : 'bg-muted w-3'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 min-h-[340px]">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 sm:px-8 py-5 border-t border-border bg-surface-2/50 flex items-center justify-between">
        <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={() => setShowHelp(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          <HelpCircle className="w-3.5 h-3.5" /> Need Help?
        </button>
        {isLastStep ? (
          <a href="https://nudgefinance.base44.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-primary-foreground bg-primary px-5 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            Open Nudigo <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button onClick={() => step < TOTAL_STEPS - 1 && setStep(step + 1)} className="flex items-center gap-1 text-sm font-bold text-primary-foreground bg-primary px-5 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </AnimatePresence>
    </div>
  );
}