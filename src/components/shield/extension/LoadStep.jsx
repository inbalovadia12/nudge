import { FolderOpen, Folder, Check } from 'lucide-react';

export default function LoadStep() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FolderOpen className="w-6 h-6 text-primary" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Step 6</span>
          <h3 className="text-lg font-bold text-foreground leading-tight">Load the Extension</h3>
        </div>
      </div>

      <ol className="space-y-3 text-sm text-muted-foreground">
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          Click <span className="font-semibold text-foreground">Load unpacked</span>.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          Select the extracted folder named <code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded text-foreground font-mono">nudigo-extension-v16</code>.
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

      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
        <p className="text-[9px] uppercase tracking-wide text-primary mb-2">Select this folder</p>
        <div className="flex items-center gap-3 bg-card rounded-lg border border-border p-3">
          <Folder className="w-8 h-8 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">nudigo-extension-v16</p>
            <p className="text-[10px] text-muted-foreground">Contains: manifest.json, content.js, background.js, icons/</p>
          </div>
          <Check className="w-5 h-5 text-success ml-auto flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}