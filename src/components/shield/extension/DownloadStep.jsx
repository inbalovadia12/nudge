import { motion } from 'framer-motion';
import { Download, Loader2, Check, ShieldCheck, ChevronRight, FileArchive } from 'lucide-react';

export default function DownloadStep({ step, downloadStatus, onDownload, downloadUrl }) {
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
            <Check className="w-6 h-6 text-success" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-success">Step 2</span>
            <h3 className="text-lg font-bold text-foreground leading-tight">Download started successfully</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your Nudigo Chrome Extension is downloading now. Check your browser's download bar — once the ZIP file finishes, proceed to extract it.
        </p>
        {downloadUrl && (
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <Download className="w-4 h-4" /> Download again
          </a>
        )}
        <div className="rounded-2xl border border-border bg-surface-2/50 p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-success flex-shrink-0" />
          <p className="text-xs text-muted-foreground">Your subscription was verified securely. No external file-sharing services were used.</p>
        </div>
        <div className="flex items-center justify-center py-2">
          <div className="w-20 h-24 rounded-xl border-2 border-dashed border-border bg-surface-2 flex flex-col items-center justify-center gap-1">
            <FileArchive className="w-8 h-8 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">nudigo-extension.zip</span>
          </div>
        </div>
      </div>
    );
  }

  if (downloadStatus === 'verifying') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Step 1</span>
            <h3 className="text-lg font-bold text-foreground leading-tight">Verifying your subscription…</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Please wait while we securely verify your Nudigo Premium subscription before generating your download link.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Secure verification in progress…
        </div>
      </div>
    );
  }

  if (downloadStatus === 'success') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
            <Check className="w-6 h-6 text-success" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-success">Verified</span>
            <h3 className="text-lg font-bold text-foreground leading-tight">Subscription verified!</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your download has started automatically. Click <span className="font-semibold text-foreground">Next</span> to continue with the installation.
        </p>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs text-success">
          <Check className="w-3.5 h-3.5" /> Download started successfully
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Download className="w-6 h-6 text-primary" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Step 1</span>
          <h3 className="text-lg font-bold text-foreground leading-tight">Download the Extension</h3>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Download the Nudigo Chrome Extension securely through our verified premium download system. Your subscription will be checked before the download begins.
      </p>
      <button onClick={onDownload} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-primary bg-primary/10 hover:bg-primary/15 hover:border-primary/50 transition-all">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Download className="w-7 h-7 text-primary" />
        </div>
        <div className="text-left flex-1">
          <p className="text-base font-bold text-foreground">Download Chrome Extension</p>
          <p className="text-xs text-muted-foreground">Secure premium download · Subscription verified</p>
        </div>
        <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
      </button>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-primary" /> No external file-sharing links — verified through your Nudigo account
      </div>
    </div>
  );
}