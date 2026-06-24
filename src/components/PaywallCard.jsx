import { Sparkles, Check, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function PaywallCard({ title = 'Premium feature', description = 'Unlock deeper insights and tools to change your spending.' }) {
  const navigate = useNavigate();
  const features = [
    'Shopping Shield with app blocker',
    'Subscription tracker & cleanup',
    'Spending heatmap',
    'Paycheck flow visualization',
    'Deal alerts & price tracking',
    'Financial Health Score',
  ];

  return (
    <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4"
      >
        <Crown className="w-7 h-7 text-primary" />
      </motion.div>
      <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-3">
        <Sparkles className="w-3 h-3" /> Nudge Premium
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{description}</p>

      <div className="space-y-2 mb-6 text-left max-w-xs mx-auto">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Check className="w-2.5 h-2.5 text-primary" />
            </div>
            <span className="text-xs text-foreground/80">{f}</span>
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => navigate('/pricing')}
        className="w-full bg-primary text-primary-foreground rounded-2xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        View Plans
      </button>
      <p className="text-[11px] text-muted-foreground/70 mt-3">
        From $4.99/mo · Cancel anytime
      </p>
    </div>
  );
}