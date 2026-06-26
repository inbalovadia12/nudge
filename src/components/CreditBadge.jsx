import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Coins } from 'lucide-react';

export default function CreditBadge({ refreshKey = 0 }) {
  const [left, setLeft] = useState(null);
  const [used, setUsed] = useState(null);

  useEffect(() => {
    async function load() {
      const [profiles, txns] = await Promise.all([
        base44.entities.UserProfile.list().catch(() => []),
        base44.entities.CreditTransaction.list().catch(() => []),
      ]);
      setLeft(profiles[0]?.credits_balance ?? 0);
      setUsed(txns.reduce((sum, t) => sum + (t.credits_spent || 0), 0));
    }
    load();
  }, [refreshKey]);

  if (left === null || used === null) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-surface-2 border border-border rounded-full px-3 py-1.5">
      <Coins className="w-3.5 h-3.5 text-primary" />
      <span className="text-xs font-semibold text-foreground">{left} left</span>
      <span className="text-[10px] text-muted-foreground">· {used} used</span>
    </div>
  );
}