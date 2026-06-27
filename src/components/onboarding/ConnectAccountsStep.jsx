import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Smartphone, CreditCard, Landmark, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const accounts = [
  { id: 'apple_screen_time', label: 'Apple Screen Time', desc: 'See where your time and money overlap', icon: Smartphone },
  { id: 'credit_card', label: 'Credit Card', desc: 'Auto-detect subscriptions and spending', icon: CreditCard },
  { id: 'bank', label: 'Bank Account', desc: 'Track cash flow and bills', icon: Landmark },
];

export default function ConnectAccountsStep({ connections, onToggle, onBack, onContinue }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h1 className="text-3xl font-bold text-foreground mb-2">Connect accounts</h1>
      <p className="text-muted-foreground mb-6">Optional, but it makes Vesper much smarter. You can skip for now.</p>

      <div className="space-y-3 mb-8">
        {accounts.map(acc => {
          const isConnected = connections[acc.id];
          return (
            <button
              key={acc.id}
              onClick={() => onToggle(acc.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${isConnected ? 'border-primary bg-primary/5' : 'border-border bg-surface-1 hover:border-primary/30'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isConnected ? 'bg-primary/10' : 'bg-surface-2'}`}>
                <acc.icon className={`w-5 h-5 ${isConnected ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{acc.label}</p>
                <p className="text-xs text-muted-foreground">{acc.desc}</p>
              </div>
              {isConnected ? (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-border flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
        <Shield className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Bank-level encryption. Vesper never stores your credentials.</span>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="ghost" className="rounded-xl h-12 px-6 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={onContinue} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12">
          {Object.values(connections).some(v => v) ? 'Continue' : 'Skip for now'} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}