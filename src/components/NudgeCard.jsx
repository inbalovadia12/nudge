import { Sparkles } from 'lucide-react';

export default function NudgeCard({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 via-orange-500/4 to-transparent p-5 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-400 mb-1">
            Advisor's Note
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}