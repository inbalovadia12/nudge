import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HelpCircle, X, AlertTriangle } from 'lucide-react';

export default function HelpModal({ onClose }) {
  const issues = [
    {
      title: 'Extension not showing up',
      steps: 'Make sure you selected the folder containing manifest.json, not a parent folder. Go back to Step 6 and re-load unpacked.',
    },
    {
      title: '"Load unpacked" button is missing',
      steps: 'Developer Mode must be ON. Go back to Step 5 and toggle it on in the upper-right corner of chrome://extensions/.',
    },
    {
      title: 'Extension disappeared after restart',
      steps: 'The extracted folder was moved or deleted. Chrome needs the folder to stay in place. Re-download and re-extract to a permanent location, then load unpacked again.',
    },
    {
      title: 'Chrome says "Errors" on the extension',
      steps: 'Click "Errors" on the extension card to see details. Make sure you extracted the ZIP fully before loading.',
    },
    {
      title: "Can't find the pin icon",
      steps: "Click the puzzle piece icon in the Chrome toolbar. If Vesper isn't listed, the extension may be disabled — enable it from chrome://extensions/.",
    },
    {
      title: 'Download did not start',
      steps: 'Make sure your subscription is active (Plus or Pro). Go back to Step 1 and click the download button again. If the issue persists, try a different browser to download the file.',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-3xl border border-border max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
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
            <Link to="/contact" className="text-sm font-bold text-primary hover:underline">Contact Support</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}