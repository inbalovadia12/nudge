import { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { CATEGORIES } from '@/lib/csvUtils';
import { Loader2, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function ManualTransactionForm({ onSaved }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [isIncome, setIsIncome] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a description and a valid amount.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const signedAmount = isIncome ? -Math.abs(numAmount) : Math.abs(numAmount);
      await base44.entities.UnifiedTransaction.create({
        date,
        description: description.trim(),
        normalized_merchant: description.trim(),
        amount: signedAmount,
        currency: currency.toUpperCase(),
        category: isIncome ? 'income' : category,
        source: 'manual',
        is_income: isIncome,
      });
      setDescription('');
      setAmount('');
      if (onSaved) onSaved();
    } catch (err) {
      setError('Failed to save transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-5 space-y-3 overflow-hidden"
    >
      <div className="flex gap-2 mb-1">
        <button
          type="button"
          onClick={() => setIsIncome(false)}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-colors ${
            !isIncome ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" /> Expense
        </button>
        <button
          type="button"
          onClick={() => setIsIncome(true)}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-colors ${
            isIncome ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" /> Income
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Currency</label>
          <input
            type="text"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            maxLength={3}
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. Coffee at Starbucks"
          className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            disabled={isIncome}
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 disabled:opacity-50"
          >
            {CATEGORIES.filter(c => c.value !== 'income').map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Add transaction'}
      </button>
    </motion.form>
  );
}