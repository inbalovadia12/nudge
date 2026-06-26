import { Sparkles } from 'lucide-react';

export default function NudgeCard({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-primary mb-1">
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