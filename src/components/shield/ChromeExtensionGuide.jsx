import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Download, FileArchive, FolderOpen, Puzzle, Pin, Check, ChevronLeft, ChevronRight,
  Lock, Crown, Copy, AlertTriangle, Chrome, Folder, ToggleRight, ExternalLink,
  ShieldCheck, Sparkles, HelpCircle, X
} from 'lucide-react';

const TOTAL_STEPS = 6;
const STORAGE_KEY = 'vesper_chrome_ext_guide_step';
const DOWNLOAD_URL = 'https://drive.google.com/file/d/1DpOnP-iYEqeYkOSnS-b3-ehVhnW88ZII/view?usp=sharing';
const APP_URL = 'https://nudgefinance.base44.app';

const stepIcons = [Download, FileArchive, Chrome, ToggleRight, FolderOpen, Pin];

export default function ChromeExtensionGuide({ isPremium, onUpgrade }) {
  const [step, setStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

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

  function copyExtensionsUrl() {
    navigator.clipboard.writeText('chrome://extensions/');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isPremium) {
    return (
      <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-card p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Crown className="w-4 h-4 text-warning" />
          <span className="text-xs font-bold uppercase tracking-wide text-warning">Premium Feature</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Chrome Extension Setup</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
          The Vesper Chrome Extension unlocks Spending Guard, website blocking, price tracking, and intelligent spending interventions — directly in your browser. Upgrade to Plus or Pro to access the guided setup.
        </p>
        <button
          onClick={onUpgrade}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <Crown className="w-4 h-4" /> Upgrade to Unlock
        </button>
      </div>
    );
  }

  const StepIcon = stepIcons[step];
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Puzzle className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">Chrome Extension</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground mb-2">
          Install the Vesper Chrome Extension
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Unlock Shopping Shield, website blocking, price tracking, purchase reminders, and intelligent spending interventions directly in Chrome.
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-6 sm:px-8 pt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">Step {step + 1} of {TOTAL_STEPS}</span>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-primary w-6' : 'bg-muted w-3'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="px-6 sm:px-8 py-6 min-h-[340px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <StepContent
              step={step}
              StepIcon={StepIcon}
              copied={copied}
              onCopy={copyExtensionsUrl}
              downloaded={downloaded}
              onDownload={() => { setDownloaded(true); window.open(DOWNLOAD_URL, '_blank'); }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 sm:px-8 py-5 border-t border-border bg-surface-2/50 flex items-center justify-between">
        <button
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" /> Need Help?
        </button>

        {isLastStep ? (
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-bold text-primary-foreground bg-primary px-5 py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Open Vesper <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button
            onClick={() => step < TOTAL_STEPS - 1 && setStep(step + 1)}
            className="flex items-center gap-1 text-sm font-bold text-primary-foreground bg-primary px-5 py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Help modal */}
      <AnimatePresence>
        {showHelp && (
          <HelpModal onClose={() => setShowHelp(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StepContent({ step, StepIcon, copied, onCopy, downloaded, onDownload }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <StepIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Step {step + 1}</span>
          <h3 className="text-lg font-bold text-foreground leading-tight">{stepTitles[step]}</h3>
        </div>
      </div>
      {step === 0 && <Step1Download downloaded={downloaded} onDownload={onDownload} />}
      {step === 1 && <Step2Extract />}
      {step === 2 && <Step3Extensions copied={copied} onCopy={onCopy} />}
      {step === 3 && <Step4DevMode />}
      {step === 4 && <Step5Load />}
      {step === 5 && <Step6Pin />}
    </div>
  );
}

const stepTitles = [
  'Download the Extension',
  'Extract the ZIP Folder',
  'Open Chrome Extensions',
  'Enable Developer Mode',
  'Load the Extension',
  'Pin and Launch',
];

/* ─── Step 1 ─── */
function Step1Download({ downloaded, onDownload }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Download the Vesper Chrome Extension package from Google Drive. You'll get a ZIP file containing everything needed.
      </p>

      {/* Download button */}
      <button
        onClick={onDownload}
        className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
          downloaded
            ? 'border-success/40 bg-success/5'
            : 'border-primary bg-primary/10 hover:bg-primary/15 hover:border-primary/50'
        }`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${downloaded ? 'bg-success/15' : 'bg-primary/20'}`}>
          {downloaded ? <Check className="w-7 h-7 text-success" /> : <Download className="w-7 h-7 text-primary" />}
        </div>
        <div className="text-left flex-1">
          <p className="text-base font-bold text-foreground">Download Vesper Extension v1.3</p>
          <p className="text-xs text-muted-foreground">
            {downloaded ? 'Downloaded — continue to step 2' : 'Click to open in Google Drive'}
          </p>
        </div>
        {!downloaded && <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />}
      </button>

      {/* Google Drive download instructions */}
      <div className="rounded-2xl border border-border bg-surface-2/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
            <Download className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Google Drive download steps</span>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">1.</span> Click the download button above to open the Google Drive file page.</li>
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">2.</span> Click the download icon (↓) in the top-right corner of the Drive preview.</li>
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">3.</span> If prompted, click "Download anyway" to confirm.</li>
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">4.</span> Wait for the ZIP file to save to your Downloads folder.</li>
        </ol>
      </div>

      {downloaded && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-success"
        >
          <Check className="w-3.5 h-3.5" /> File saved. Proceed to extraction.
        </motion.div>
      )}

      {/* File illustration */}
      <div className="flex items-center justify-center py-2">
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-24 rounded-xl border-2 border-dashed border-border bg-surface-2 flex flex-col items-center justify-center gap-1">
            <FileArchive className="w-8 h-8 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">vesper_v1.3.zip</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2 ─── */
function Step2Extract() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Locate the downloaded file named <code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded text-foreground font-mono">vesper_v1.3.zip</code> in your Downloads folder.
      </p>

      {/* Windows */}
      <div className="rounded-2xl border border-border bg-surface-2/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center text-xs">🪟</div>
          <span className="text-sm font-semibold text-foreground">Windows</span>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">1.</span> Right-click the file.</li>
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">2.</span> Select "Extract All..."</li>
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">3.</span> Click "Extract".</li>
        </ol>
      </div>

      {/* Mac */}
      <div className="rounded-2xl border border-border bg-surface-2/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs"></div>
          <span className="text-sm font-semibold text-foreground">Mac</span>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">1.</span> Double-click the ZIP file.</li>
        </ol>
      </div>

      {/* Warning */}
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-foreground mb-1">Important</p>
          <p className="text-xs text-muted-foreground">
            Do not move, rename, or delete the extracted folder after installation, or Chrome will disable the extension.
          </p>
        </div>
      </div>

      {/* Illustration */}
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="w-16 h-20 rounded-xl border-2 border-border bg-surface-2 flex flex-col items-center justify-center">
          <FileArchive className="w-7 h-7 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground mt-1">.zip</span>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
        <div className="w-16 h-20 rounded-xl border-2 border-primary/30 bg-primary/5 flex flex-col items-center justify-center">
          <Folder className="w-7 h-7 text-primary" />
          <span className="text-[9px] text-primary mt-1">vesper_v1.3</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3 ─── */
function Step3Extensions({ copied, onCopy }) {
  return (
    <div className="space-y-4">
      <ol className="space-y-3 text-sm text-muted-foreground">
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          Open Google Chrome.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          Enter <code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded text-foreground font-mono">chrome://extensions/</code> in the address bar.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
          Press Enter.
        </li>
      </ol>

      {/* Copy button */}
      <button
        onClick={onCopy}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Copy chrome://extensions/</span>
          </>
        )}
      </button>

      {/* Address bar illustration */}
      <div className="rounded-xl border border-border bg-surface-2 p-3">
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1.5">Chrome address bar</p>
        <div className="flex items-center gap-2 bg-card rounded-lg border border-border px-3 py-2">
          <Chrome className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-foreground font-mono truncate">chrome://extensions/</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4 ─── */
function Step4DevMode() {
  return (
    <div className="space-y-4">
      <ol className="space-y-3 text-sm text-muted-foreground">
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          Find the Developer Mode toggle in the upper-right corner.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          Turn it <span className="font-semibold text-foreground">ON</span>.
        </li>
      </ol>

      {/* Illustration of the extensions page with dev mode toggle */}
      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">Extensions page</p>
        {/* Fake toolbar row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-foreground">Extensions</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Developer mode</span>
            {/* Toggle ON */}
            <div className="relative w-9 h-5 rounded-full bg-primary flex items-center">
              <div className="absolute right-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </div>
          </div>
        </div>
        {/* Dashed pointer arrow */}
        <div className="flex justify-end">
          <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
            <span>← Toggle this</span>
          </div>
        </div>
        {/* Fake extension card */}
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-3 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-muted" />
            <div>
              <div className="h-2 w-24 bg-muted rounded" />
              <div className="h-1.5 w-16 bg-muted/50 rounded mt-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Developer mode is required to load unpacked extensions. It's safe to keep on — it only adds the "Load unpacked" button.
        </p>
      </div>
    </div>
  );
}

/* ─── Step 5 ─── */
function Step5Load() {
  return (
    <div className="space-y-4">
      <ol className="space-y-3 text-sm text-muted-foreground">
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          Click <span className="font-semibold text-foreground">Load unpacked</span>.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          Select the extracted folder named <code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded text-foreground font-mono">vesper_v1.3</code>.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
          Ensure you choose the folder containing the extension files.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
          Click <span className="font-semibold text-foreground">Open</span> or <span className="font-semibold text-foreground">Select Folder</span>.
        </li>
      </ol>

      {/* Illustration: Load unpacked button */}
      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">Extensions toolbar</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-muted" />
            <span className="text-xs text-muted-foreground">Extensions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Developer mode</span>
            <div className="relative w-9 h-5 rounded-full bg-primary flex items-center">
              <div className="absolute right-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/30 px-3 py-2 rounded-lg">
            <FolderOpen className="w-3.5 h-3.5" /> Load unpacked
          </button>
          <button className="text-xs text-muted-foreground bg-card border border-border px-3 py-2 rounded-lg">Pack extension</button>
          <button className="text-xs text-muted-foreground bg-card border border-border px-3 py-2 rounded-lg">Update</button>
        </div>
      </div>

      {/* Folder picker illustration */}
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
        <p className="text-[9px] uppercase tracking-wide text-primary mb-2">Select this folder</p>
        <div className="flex items-center gap-3 bg-card rounded-lg border border-border p-3">
          <Folder className="w-8 h-8 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">vesper_v1.3</p>
            <p className="text-[10px] text-muted-foreground">Contains: manifest.json, content.js, background.js, icons/</p>
          </div>
          <Check className="w-5 h-5 text-success ml-auto flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 6 ─── */
function Step6Pin() {
  return (
    <div className="space-y-5">
      <ol className="space-y-3 text-sm text-muted-foreground">
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          Click the puzzle icon next to the Chrome address bar.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          Find <span className="font-semibold text-foreground">Vesper v1.3</span>.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
          Click the pin icon.
        </li>
      </ol>

      {/* Puzzle icon illustration */}
      <div className="flex items-center justify-center py-1">
        <div className="rounded-xl border border-border bg-surface-2 px-4 py-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted/50" />
          <div className="w-6 h-6 rounded bg-muted/50" />
          <Puzzle className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-col items-center">
            <Pin className="w-3.5 h-3.5 text-primary" />
            <span className="text-[8px] text-primary font-bold">PIN</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Vesper v1.3</span>
        </div>
      </div>

      {/* Completion checkmarks */}
      <div className="rounded-2xl border-2 border-success/30 bg-success/5 p-5 space-y-3">
        {[
          { text: 'Extension installed', icon: Check },
          { text: 'Shopping Shield enabled', icon: ShieldCheck },
          { text: 'Ready to use', icon: Sparkles },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
              <item.icon className="w-4 h-4 text-success" />
            </div>
            <span className="text-sm font-medium text-foreground">{item.text}</span>
          </motion.div>
        ))}
      </div>

      {/* Open Vesper button */}
      <a
        href={APP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl text-base font-bold hover:bg-primary/90 transition-colors"
      >
        Open Vesper <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

/* ─── Help Modal ─── */
function HelpModal({ onClose }) {
  const issues = [
    {
      title: 'Extension not showing up',
      steps: 'Make sure you selected the folder containing manifest.json, not a parent folder. Go back to Step 5 and re-load unpacked.',
    },
    {
      title: '"Load unpacked" button is missing',
      steps: 'Developer Mode must be ON. Go back to Step 4 and toggle it on in the upper-right corner of chrome://extensions/.',
    },
    {
      title: 'Extension disappeared after restart',
      steps: 'The extracted folder was moved or deleted. Chrome needs the folder to stay in place. Re-download and re-extract to a permanent location, then load unpacked again.',
    },
    {
      title: 'Chrome says "Errors" on the extension',
      steps: 'Click "Errors" on the extension card to see details. Make sure you downloaded the correct version (v1.3) and extracted it fully before loading.',
    },
    {
      title: 'Can\'t find the pin icon',
      steps: 'Click the puzzle piece icon in the Chrome toolbar. If Vesper isn\'t listed, the extension may be disabled — enable it from chrome://extensions/.',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Troubleshooting</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {issues.map((issue, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface-2/50 p-4">
              <div className="flex items-start gap-2 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-foreground">{issue.title}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">{issue.steps}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">Still stuck?</p>
            <Link to="/pricing" className="text-sm font-bold text-primary hover:underline">Contact Support</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}