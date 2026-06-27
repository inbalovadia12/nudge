import { useState } from 'react';
import { Chrome, Copy, Check } from 'lucide-react';

export default function ExtensionsStep() {
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText('chrome://extensions/');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Chrome className="w-6 h-6 text-primary" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Step 4</span>
          <h3 className="text-lg font-bold text-foreground leading-tight">Open Chrome Extensions</h3>
        </div>
      </div>

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

      <button onClick={copyUrl} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
        {copied ? (
          <><Check className="w-4 h-4 text-success" /><span className="text-sm font-medium text-success">Copied!</span></>
        ) : (
          <><Copy className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-primary">Copy chrome://extensions/</span></>
        )}
      </button>

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