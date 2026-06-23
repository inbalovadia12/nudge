import {
  Plane, Shield, Smartphone, Home as HomeIcon, Car, GraduationCap,
  Heart, Target, UtensilsCrossed, ShoppingBag, Clapperboard,
  ShoppingCart, Receipt, Laptop, Package, Wallet, Sparkles
} from 'lucide-react';

export const GOAL_ICONS = {
  plane: { icon: Plane, label: 'Vacation' },
  shield: { icon: Shield, label: 'Emergency Fund' },
  smartphone: { icon: Smartphone, label: 'Gadget' },
  home: { icon: HomeIcon, label: 'Home' },
  car: { icon: Car, label: 'Car' },
  graduation: { icon: GraduationCap, label: 'Education' },
  heart: { icon: Heart, label: 'Wedding' },
  target: { icon: Target, label: 'Custom Goal' },
};

export const CATEGORY_ICONS = {
  dining: UtensilsCrossed,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  transport: Car,
  groceries: ShoppingCart,
  bills: Receipt,
  health: Heart,
  travel: Plane,
  tech: Laptop,
  other: Package,
};

export const CATEGORY_LABELS = {
  dining: 'Dining',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  transport: 'Transport',
  groceries: 'Groceries',
  bills: 'Bills',
  health: 'Health',
  travel: 'Travel',
  tech: 'Tech',
  other: 'Other',
};

export const VERDICT_CONFIG = {
  green: {
    color: 'success',
    ring: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
    dot: 'bg-success',
    title: 'Looks good',
    subtitle: 'This fits your goals and balance.',
    icon: Sparkles,
  },
  amber: {
    color: 'warning',
    ring: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    dot: 'bg-warning',
    title: 'Worth pausing',
    subtitle: "Here's why.",
    icon: Wallet,
  },
  red: {
    color: 'danger',
    ring: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    dot: 'bg-danger',
    title: 'This would set you back',
    subtitle: "Here's the impact.",
    icon: Wallet,
  },
};

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}

export function calculateProgress(current, target) {
  if (!target || target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function estimateCompletionDate(current, target, monthlyIncome, strictness) {
  if (!target || !monthlyIncome) return null;
  const remaining = target - (current || 0);
  if (remaining <= 0) return 'Goal reached!';
  
  const savingsRate = strictness === 'strict' ? 0.25 : strictness === 'moderate' ? 0.18 : 0.12;
  const monthlySavings = monthlyIncome * savingsRate;
  if (monthlySavings <= 0) return null;
  
  const monthsNeeded = Math.ceil(remaining / monthlySavings);
  const date = new Date();
  date.setMonth(date.getMonth() + monthsNeeded);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}