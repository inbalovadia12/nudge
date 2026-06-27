import { FileArchive, Folder, ChevronRight, AlertTriangle } from 'lucide-react';

export default function ExtractStep() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileArchive className="w-6 h-6 text-primary" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Step 3</span>
          <h3 className="text-lg font-bold text-foreground leading-tight">Extract the ZIP File</h3>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Locate the downloaded file named <code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded text-foreground font-mono">vesper-extension.zip</code> in your Downloads folder.
      </p>

      <div className="rounded-2xl border border-border bg-surface-2/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center text-xs">🪟</div>
          <span className="text-sm font-semibold text-foreground">Windows</span>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">1.</span> Right-click the ZIP file.</li>
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">2.</span> Select "Extract All..."</li>
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">3.</span> Click "Extract".</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-border bg-surface-2/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs">🍎</div>
          <span className="text-sm font-semibold text-foreground">Mac</span>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">1.</span> Double-click the ZIP file.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-foreground mb-1">Important</p>
          <p className="text-xs text-muted-foreground">Do not move, rename, or delete the extracted folder after installation, or Chrome will disable the extension.</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 py-2">
        <div className="w-16 h-20 rounded-xl border-2 border-border bg-surface-2 flex flex-col items-center justify-center">
          <FileArchive className="w-7 h-7 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground mt-1">.zip</span>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
        <div className="w-16 h-20 rounded-xl border-2 border-primary/30 bg-primary/5 flex flex-col items-center justify-center">
          <Folder className="w-7 h-7 text-primary" />
          <span className="text-[9px] text-primary mt-1">vesper-extension</span>
        </div>
      </div>
    </div>
  );
}