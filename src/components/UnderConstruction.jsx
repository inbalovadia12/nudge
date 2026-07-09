import { Construction } from 'lucide-react';

export default function UnderConstruction({ title = 'Under Construction', message = 'This feature is currently under construction. Check back soon!' }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
        <Construction className="w-7 h-7 text-warning" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">{message}</p>
    </div>
  );
}