import { Pin, Puzzle } from 'lucide-react';

export default function PinStep() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Pin className="w-6 h-6 text-primary" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Step 7</span>
          <h3 className="text-lg font-bold text-foreground leading-tight">Pin the Extension</h3>
        </div>
      </div>

      <ol className="space-y-3 text-sm text-muted-foreground">
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          Click the puzzle icon next to the Chrome address bar.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          Find <span className="font-semibold text-foreground">Nudigo</span>.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
          Click the pin icon.
        </li>
      </ol>

      <div className="flex items-center justify-center py-1">
        <div className="rounded-xl border border-border bg-surface-2 px-4 py-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted/50" />
          <div className="w-6 h-6 rounded bg-muted/50" />
          <Puzzle className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-col items-center">
            <Pin className="w-3.5 h-3.5 text-primary" />
            <span className="text-[8px] text-primary font-bold">PIN</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Nudigo</span>
        </div>
      </div>
    </div>
  );
}