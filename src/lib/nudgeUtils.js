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

  const [profiles, goals, purchases, savedItems, bills, subscriptions, bankAccounts, bankTransactions] = await Promise.all([
    base44.entities.UserProfile.list(),
    base44.entities.SavingsGoal.filter({ status: 'active' }),
    base44.entities.Purchase.list('-date', 50),
    base44.entities.SavedItem.filter({ status: 'tracking' }),
    base44.entities.Bill.filter({ status: 'upcoming' }).catch(() => []),
    base44.entities.Subscription.filter({ status: 'active' }).catch(() => []),
    base44.entities.BankAccount.list().catch(() => []),
    base44.entities.BankTransaction.list('-date', 30).catch(() => []),
  ]);

  const profile = profiles[0] || { first_name: 'there', monthly_income: 0, strictness: 'moderate', onboarding_complete: false, is_premium: false, plan_type: 'free' };
  const primaryGoal = goals.find(g => g.is_primary) || goals[0] || null;
  const totalSpent = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balance = (profile.monthly_income || 0) - totalSpent;

  const categoryTotals = {};
  purchases.forEach(p => {
    const cat = p.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (p.amount || 0);
  });

  const totalBills = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSubscriptions = subscriptions.reduce((sum, s) => sum + (s.monthly_cost || 0), 0);
  const totalBankBalance = bankAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);

  _cachedContext = { profile, goals, primaryGoal, purchases, savedItems, totalSpent, balance, categoryTotals, bills, subscriptions, bankAccounts, bankTransactions, totalBills, totalSubscriptions, totalBankBalance };
  _cacheTime = now;
  return _cachedContext;
}

export function buildContextString(ctx) {
  const { profile, primaryGoal, purchases, totalSpent, balance, categoryTotals, bills, subscriptions, bankAccounts, bankTransactions, totalBills, totalSubscriptions, totalBankBalance } = ctx;
  let str = `User's first name: ${profile.first_name}. Monthly take-home income: $${profile.monthly_income || 0}. `;
  str += `Estimated current balance: $${Math.round(balance)}. Total spent (recent): $${Math.round(totalSpent)}. `;
  str += `Coaching strictness: ${profile.strictness || 'moderate'}. `;

  if (primaryGoal) {
    const pct = Math.round((primaryGoal.current_amount / primaryGoal.target_amount) * 100);
    str += `Primary savings goal: "${primaryGoal.name}", target $${primaryGoal.target_amount}, saved $${primaryGoal.current_amount} (${pct}% complete). `;
  }

  if (purchases.length > 0) {
    const recentCats = Object.entries(categoryTotals).map(([cat, amt]) => `${cat}: $${Math.round(amt)}`).join(', ');
    str += `Recent spending by category: ${recentCats}. `;
    str += `Last 5 purchases: ${purchases.slice(0, 5).map(p => `${p.merchant} $${p.amount}`).join(', ')}.`;
  }

  if (bills && bills.length > 0) {
    str += ` Upcoming bills: ${bills.map(b => `${b.name} $${b.amount} (due ${b.due_date}, ${b.category})`).join(', ')}. Total upcoming bills: $${Math.round(totalBills)}.`;
  }

  if (subscriptions && subscriptions.length > 0) {
    str += ` Active subscriptions: ${subscriptions.map(s => `${s.name} $${s.monthly_cost}/mo (${s.billing_cycle})`).join(', ')}. Total monthly subscriptions: $${Math.round(totalSubscriptions)}.`;
  }

  if (bankAccounts && bankAccounts.length > 0) {
    str += ` Linked bank accounts: ${bankAccounts.map(a => `${a.name} ${a.mask || ''} balance $${a.current_balance}`).join(', ')}. Total bank balance: $${Math.round(totalBankBalance)}.`;
  }

  if (bankTransactions && bankTransactions.length > 0) {
    str += ` Recent bank transactions: ${bankTransactions.slice(0, 10).map(t => `${t.name} $${t.amount} on ${t.date}`).join(', ')}.`;
  }

  return str;
}

export function buildNudgeSystemPrompt(contextString, options = {}) {
  const { extraRules = '' } = options;

  let prompt = `You are Nudigo, a warm, sharp financial coach and friend. You're having a real conversation, not giving a lecture.

PERSONALITY:
- Speak naturally, like a smart friend who happens to know their finances — not a financial advisor, not a robot
- Use their first name occasionally (not every sentence), the way a friend would
- Be direct and honest — if something is a bad idea, say so, but never with judgment or shame
- Use contractions ("you're", "that's", "here's") — talk like a person, not a textbook
- Keep it conversational — short paragraphs, natural flow
- Ask follow-up questions when it moves the conversation forward
- Light humor when it fits naturally

ACCURACY (CRITICAL):
- ONLY use the financial data provided in the context below — never invent numbers, balances, or transactions
- If the user asks about something you don't have data for (like utility bills they haven't logged), say "I don't have that logged yet" and suggest they add it — do NOT make up estimates
- When you give a number, show the math briefly so they can follow (e.g., "$6,000 in purchases leaves you with $4,000 from your $10,000 balance")
- If you are estimating or projecting, clearly say "roughly" or "about"
- Reference their actual savings goals, bills, and subscriptions by name when relevant

RESPONSE GUIDELINES:
- Keep responses concise — 2-4 short paragraphs max unless they ask for detail
- Lead with the direct answer, then add context
- End with a natural follow-up question or offer to dig deeper
- Never use the word "budget" — say "spending" or "money flow" instead
- Never say "you should" — offer observations and options instead

FINANCIAL CONTEXT:
${contextString}`;

  if (extraRules) {
    prompt += '\n\n' + extraRules;
  }
  return prompt;
}