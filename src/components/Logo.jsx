import { Sparkles } from 'lucide-react';

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { box: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-lg' },
    md: { box: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-xl' },
    lg: { box: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-2xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-2">
      <div className={`${s.box} rounded-xl bg-primary/15 flex items-center justify-center`}>
        <Sparkles className={`${s.icon} text-primary`} />
      </div>
      <span className={`${s.text} font-bold font-heading tracking-tight`}>Nudge</span>
    </div>
  );
}