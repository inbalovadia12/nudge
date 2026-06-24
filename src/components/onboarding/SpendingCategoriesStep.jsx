import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, ShoppingBag, Utensils, Coffee, Gamepad2, Plane, CreditCard, Cpu, Shirt, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'coffee', label: 'Coffee', icon: Coffee },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'tech', label: 'Technology', icon: Cpu },
  { id: 'fashion', label: 'Fashion', icon: Shirt },
  { id: 'entertainment', label: 'Entertainment', icon: Clapperboard },
];

export default function SpendingCategoriesStep({ selected, onToggle, onBack, onContinue }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h1 className="text-3xl font-bold text-foreground mb-2">What do you spend on?</h1>
      <p className="text-muted-foreground mb-6">Pick all that apply. This helps me spot patterns.</p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {categories.map(cat => {
          const isSelected = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onToggle(cat.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-surface-1 hover:border-primary/30'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary/10' : 'bg-surface-2'}`}>
                <cat.icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="ghost" className="rounded-xl h-12 px-6 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={onContinue} disabled={selected.length === 0} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12">
          Continue <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}