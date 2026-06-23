import { Bookmark } from 'lucide-react';
import { VERDICT_CONFIG, formatCurrency } from '@/lib/nudge-utils';

export default function VerdictCard({ verdict, onBuy, onSave, actionLoading }) {
  if (!verdict) return null;
  const config = VERDICT_CONFIG[verdict.verdict_tier] || VERDICT_CONFIG.green;

  return (
    <div className="animate-settle">
      <div className={`rounded-3xl border ${config.border} ${config.bg} p-6`}>
        {/* Verdict indicator */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className={`w-2.5 h-2.5 rounded-full ${config.dot} animate-pulse-ring`} />
          <span className={`text-sm font-semibold ${config.ring}`}>
            {config.title}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mb-6">{config.subtitle}</p>

        {/* Product */}
        <div className="mb-6">
          <h3 className="text-xl font-bold font-heading leading-tight">
            {verdict.product_name}
          </h3>
          <p className="text-2xl font-bold font-heading text-primary mt-1">
            {formatCurrency(verdict.price)}
          </p>
        </div>

        {/* Supporting details */}
        <div className="space-y-3 mb-6">
          {verdict.supporting_details?.map((detail, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div
                className={`w-1.5 h-1.5 rounded-full ${config.dot} mt-1.5 flex-shrink-0`}
              />
              <p className="text-foreground/90 leading-relaxed">{detail}</p>
            </div>
          ))}
        </div>

        {/* Verdict message */}
        {verdict.verdict_message && (
          <div className="mb-6 rounded-2xl bg-background/50 p-4">
            <p className="text-sm text-foreground/80 italic leading-relaxed">
              "{verdict.verdict_message}"
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSave}
            disabled={actionLoading}
            className="flex-1 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm font-semibold hover:bg-secondary/70 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Bookmark className="w-4 h-4" />
            Save for later
          </button>
          <button
            onClick={onBuy}
            disabled={actionLoading}
            className="flex-1 rounded-2xl bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Buy anyway
          </button>
        </div>
      </div>
    </div>
  );
}