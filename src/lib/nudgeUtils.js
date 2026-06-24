import {
  UtensilsCrossed, ShoppingBag, Film, ShoppingCart, Car, Receipt, Circle,
  Plane, Shield, Gift, Smartphone, Home, Heart, GraduationCap, Star
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export const categoryIcons = {
  dining: UtensilsCrossed,
  shopping: ShoppingBag,
  entertainment: Film,
  groceries: ShoppingCart,
  transport: Car,
  bills: Receipt,
  other: Circle
};

export const goalIcons = {
  plane: Plane,
  shield: Shield,
  gift: Gift,
  smartphone: Smartphone,
  home: Home,
  heart: Heart,
  car: Car,
  graduation: GraduationCap,
  custom: Star
};

export const goalOptions = [
  { icon: 'plane', label: 'Vacation', defaultTarget: 3000 },
  { icon: 'shield', label: 'Emergency Fund', defaultTarget: 5000 },
  { icon: 'gift', label: 'Something Special', defaultTarget: 1000 },
  { icon: 'smartphone', label: 'New Gadget', defaultTarget: 1200 },
  { icon: 'home', label: 'Down Payment', defaultTarget: 15000 },
  { icon: 'car', label: 'A Car', defaultTarget: 8000 },
  { icon: 'graduation', label: 'Education', defaultTarget: 5000 },
  { icon: 'custom', label: 'Custom Goal', defaultTarget: 2000 }
];

export function getCategoryIcon(category) {
  return categoryIcons[category] || Circle;
}

export function getGoalIcon(icon) {
  return goalIcons[icon] || Star;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatCurrencyDetailed(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

export function getGreeting(name) {
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17 || hour < 5) greeting = 'Good evening';
  return `${greeting}, ${name}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateLong(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export const verdictConfig = {
  green: {
    label: 'Looks good',
    message: 'This fits your goals and your spending rhythm.',
    color: 'success',
    hex: '#16A34A',
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
    dot: 'bg-success'
  },
  amber: {
    label: 'Worth pausing',
    message: 'Here\'s what I noticed.',
    color: 'caution',
    hex: '#D97706',
    bg: 'bg-caution/10',
    text: 'text-caution',
    border: 'border-caution/30',
    dot: 'bg-caution'
  },
  red: {
    label: 'This would set you back',
    message: 'Here\'s the impact.',
    color: 'danger',
    hex: '#DC2626',
    bg: 'bg-danger/10',
    text: 'text-danger',
    border: 'border-danger/30',
    dot: 'bg-danger'
  }
};

// --- In-memory cache for user financial data (avoids redundant API calls across pages) ---
let _cachedContext = null;
let _cacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export function clearUserDataCache() {
  _cachedContext = null;
  _cacheTime = 0;
}

export async function getFinancialContext() {
  const now = Date.now();
  if (_cachedContext && now - _cacheTime < CACHE_TTL) {
    return _cachedContext;
  }

  const [profiles, goals, purchases, savedItems] = await Promise.all([
    base44.entities.UserProfile.list(),
    base44.entities.SavingsGoal.filter({ status: 'active' }),
    base44.entities.Purchase.list('-date', 50),
    base44.entities.SavedItem.filter({ status: 'tracking' })
  ]);

  const profile = profiles[0] || { first_name: 'there', monthly_income: 0, strictness: 'moderate', onboarding_complete: false };
  const primaryGoal = goals.find(g => g.is_primary) || goals[0] || null;
  const totalSpent = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balance = (profile.monthly_income || 0) - totalSpent;

  const categoryTotals = {};
  purchases.forEach(p => {
    const cat = p.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (p.amount || 0);
  });

  _cachedContext = { profile, goals, primaryGoal, purchases, savedItems, totalSpent, balance, categoryTotals };
  _cacheTime = now;
  return _cachedContext;
}

export function buildContextString(ctx) {
  const { profile, primaryGoal, purchases, totalSpent, balance, categoryTotals } = ctx;
  let str = `User name: ${profile.first_name}. Monthly take-home income: $${profile.monthly_income || 0}. `;
  str += `Estimated current balance: $${Math.round(balance)}. Total spent (recent): $${Math.round(totalSpent)}. `;
  str += `Strictness setting: ${profile.strictness}. `;
  if (primaryGoal) {
    const pct = Math.round((primaryGoal.current_amount / primaryGoal.target_amount) * 100);
    str += `Primary savings goal: "${primaryGoal.name}", target $${primaryGoal.target_amount}, saved $${primaryGoal.current_amount} (${pct}% complete). `;
  }
  if (purchases.length > 0) {
    const recentCats = Object.entries(categoryTotals).map(([cat, amt]) => `${cat}: $${Math.round(amt)}`).join(', ');
    str += `Recent spending by category: ${recentCats}. `;
    str += `Last 5 purchases: ${purchases.slice(0, 5).map(p => `${p.merchant} $${p.amount}`).join(', ')}.`;
  }
  return str;
}