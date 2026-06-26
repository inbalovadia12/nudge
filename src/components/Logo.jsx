export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { box: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-lg' },
    md: { box: 'w-9 h-9', icon: 'w-5 h-5', text: 'text-xl' },
    lg: { box: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-3xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-xl bg-primary/15 flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="none" className={s.icon}>
          <circle cx="9" cy="12" r="6.5" fill="currentColor" className="text-primary" fillOpacity="0.9" />
          <circle cx="15" cy="12" r="6.5" stroke="currentColor" className="text-primary" strokeWidth="2.5" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${s.text} font-bold font-heading tracking-tight text-foreground`}>NUDGE</span>
        <span className="text-[8px] sm:text-[9px] font-medium text-muted-foreground tracking-wider uppercase mt-0.5">AI Financial Advisor</span>
      </div>
    </div>
  );
}