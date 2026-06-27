import { ToggleRight, Sparkles } from 'lucide-react';

export default function DevModeStep() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ToggleRight className="w-6 h-6 text-primary" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Step 5</span>
          <h3 className="text-lg font-bold text-foreground leading-tight">Enable Developer Mode</h3>
        </div>
      </div>

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

      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">Extensions page</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-foreground">Extensions</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Developer mode</span>
            <div className="relative w-9 h-5 rounded-full bg-primary flex items-center">
              <div className="absolute right-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="flex items-center gap-1 text-[10px] text-primary font-medium"><span>← Toggle this</span></div>
        </div>
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
        <p className="text-xs text-muted-foreground">Developer mode is required to load unpacked extensions. It's safe to keep on — it only adds the "Load unpacked" button.</p>
      </div>
    </div>
  );
}