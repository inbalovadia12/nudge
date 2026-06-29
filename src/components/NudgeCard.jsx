import { Sparkles } from 'lucide-react';

export default function NudgeCard({ message, nudge, loading }) {
  const content = message ?? nudge;

  if (loading) {
    return (
      <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.06] via-orange-500/[0.03] to-transparent p-5 h-full min-h-[120px] flex items-center">
        <div className="flex items-start gap-3 w-full">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded-full bg-amber-500/15 animate-pulse" />
            <div className="h-3 w-full rounded-full bg-foreground/5 animate-pulse" />
            <div className="h-3 w-4/5 rounded-full bg-foreground/5 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.06] via-orange-500/[0.03] to-transparent p-5 animate-slide-up h-full">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-400 mb-1">
            Advisor's Note
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}