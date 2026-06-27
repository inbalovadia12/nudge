import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';

export default function CompleteStep() {
  const items = [
    { text: 'Extension Installed', icon: CheckCircle },
    { text: 'Shopping Shield Active', icon: ShieldCheck },
    { text: 'Premium Features Unlocked', icon: Sparkles },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-success" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-success">Step 8</span>
          <h3 className="text-lg font-bold text-foreground leading-tight">Setup Complete</h3>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-success/30 bg-success/5 p-5 space-y-3">
        {items.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.15 }} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
              <item.icon className="w-4 h-4 text-success" />
            </div>
            <span className="text-sm font-medium text-foreground">{item.text}</span>
          </motion.div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed text-center">
        You're all set! The Nudigo Chrome Extension is installed and ready to protect your spending.
      </p>

      <a href="https://nudgefinance.base44.app" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl text-base font-bold hover:bg-primary/90 transition-colors">
        Open Nudigo Dashboard <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}