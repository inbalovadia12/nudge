import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { usePremiumStatus } from '@/lib/usePremium';
import { getUserTier, TIER_LABELS, TIER_DESCRIPTIONS } from '@/lib/csvUtils';
import { formatCurrency } from '@/lib/nudgeUtils';
import TransactionItem from '@/components/transactions/TransactionItem';
import CategoryBreakdown from '@/components/transactions/CategoryBreakdown';
import CsvImportWizard from '@/components/transactions/CsvImportWizard';
import ManualTransactionForm from '@/components/transactions/ManualTransactionForm';
import ConnectPlaid from '@/components/ConnectPlaid';
import { FileSpreadsheet, PenLine, Landmark, TrendingUp, TrendingDown, Wallet, ArrowRight, Loader2, RefreshCw, Sparkles, Lock } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';

const TIER_BADGE_COLORS = {
  free: 'bg-muted text-muted-foreground',
  plus: 'bg-primary/15 text-primary',
  pro: 'bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground'
};

export default function Transactions() {
  const { profile, loading } = usePremiumStatus();
  const [transactions, setTransactions] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [showCsvWizard, setShowCsvWizard] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState('all');

  const tier = getUserTier(profile);

  const loadTransactions = useCallback(async () => {
    try {
      const txns = await base44.entities.UnifiedTransaction.list('-date', 200);
      setTransactions(txns);
    } catch {}
    setPageLoading(false);
  }, []);

  useEffect(() => {
    if (profile) loadTransactions();
  }, [profile, loadTransactions]);

  const handleRefresh = useCallback(async () => {
    await loadTransactions();
  }, [loadTransactions]);

  const handlePlaidSync = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke('plaid', { action: 'sync_data' });
      await loadTransactions();
    } catch {}
    setSyncing(false);
  };

  const handleDelete = async (txn) => {
    try {
      await base44.entities.UnifiedTransaction.delete(txn.id);
      setTransactions((prev) => prev.filter((t) => t.id !== txn.id));
    } catch {}
  };

  // Stats
  const income = transactions.filter((t) => t.is_income).reduce((s, t) => s + Math.abs(t.amount), 0);
  const expenses = transactions.filter((t) => !t.is_income).reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  // Filtered transactions
  const filtered = transactions.filter((t) => {
    if (filter === 'income') return t.is_income;
    if (filter === 'expense') return !t.is_income;
    return true;
  });

  // Monthly summary (Tier 2+)
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = transactions.filter((t) => t.date?.startsWith(monthStr));
  const monthIncome = thisMonth.filter((t) => t.is_income).reduce((s, t) => s + Math.abs(t.amount), 0);
  const monthExpenses = thisMonth.filter((t) => !t.is_income).reduce((s, t) => s + t.amount, 0);

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>);

  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 sm:p-6 lg:p-10 max-w-2xl mx-auto pb-24 lg:pb-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Transactions</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{TIER_DESCRIPTIONS[tier]}</p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${TIER_BADGE_COLORS[tier]}`}>
            {TIER_LABELS[tier]}
          </span>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-2 mt-4">
          
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Income</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-success">{formatCurrency(income)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-danger" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Expenses</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-foreground">{formatCurrency(expenses)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-1 mb-1">
              <Wallet className="w-3 h-3 text-primary" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Balance</span>
            </div>
            <p className={`text-sm sm:text-base font-bold ${balance >= 0 ? 'text-foreground' : 'text-danger'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </motion.div>

        {/* Monthly summary (Tier 2+) */}
        {tier !== 'free' && thisMonth.length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          
            <p className="text-xs font-bold text-foreground mb-2">This Month</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {formatCurrency(monthExpenses)} spent · {formatCurrency(monthIncome)} earned
              </span>
              <span className={`font-semibold ${monthIncome - monthExpenses >= 0 ? 'text-success' : 'text-danger'}`}>
                {monthIncome - monthExpenses >= 0 ? '+' : ''}{formatCurrency(monthIncome - monthExpenses)}
              </span>
            </div>
          </motion.div>
        }

        {/* Data source actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 space-y-3">
          
          {/* CSV Import */}
          <button
            onClick={() => {setShowCsvWizard(!showCsvWizard);setShowManualForm(false);}}
            className={`w-full flex items-center gap-3 rounded-2xl p-4 border transition-colors ${
            showCsvWizard ? 'bg-primary/10 border-primary/30' : 'bg-card border-border hover:border-primary/30'}`
            }>
            
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-foreground">Import from CSV</p>
              <p className="text-xs text-muted-foreground">Upload a bank statement file</p>
            </div>
          </button>
          <AnimatePresence>
            {showCsvWizard && <CsvImportWizard tier={tier} onComplete={loadTransactions} />}
          </AnimatePresence>

          {/* Manual Entry */}
          <button
            onClick={() => {setShowManualForm(!showManualForm);setShowCsvWizard(false);}}
            className={`w-full flex items-center gap-3 rounded-2xl p-4 border transition-colors ${
            showManualForm ? 'bg-primary/10 border-primary/30' : 'bg-card border-border hover:border-primary/30'}`
            }>
            
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <PenLine className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-foreground">Add manually</p>
              <p className="text-xs text-muted-foreground">Enter an income or expense</p>
            </div>
          </button>
          <AnimatePresence>
            {showManualForm && <ManualTransactionForm onSaved={() => {setShowManualForm(false);loadTransactions();}} />}
          </AnimatePresence>

          {/* Plaid Bank Sync (Tier 3 only) */}
          {tier === 'pro' ?
          profile?.connected_bank ?
          <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{profile.plaid_institution_name || 'Bank connected'}</span>
                  </div>
                  <span className="text-[10px] text-success font-medium">Connected</span>
                </div>
                <button
              onClick={handlePlaidSync}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-xl py-2 text-sm font-medium hover:bg-primary/15 transition-colors disabled:opacity-50">
              
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {syncing ? 'Syncing...' : 'Sync now'}
                </button>
              </div> :

          <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Landmark className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">Connect your bank - Beta  - Sandbox  </span>
                </div>
                <ConnectPlaid connected={false} onConnected={loadTransactions} />
              </div> :


          <Link
            to="/pricing"
            className="w-full flex items-center gap-3 rounded-2xl p-4 border border-dashed border-border bg-muted/30 hover:border-primary/30 transition-colors group">
            
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                {tier === 'free' ? <Lock className="w-5 h-5 text-muted-foreground" /> : <Landmark className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-foreground">Bank sync automation</p>
                <p className="text-xs text-muted-foreground">Upgrade to Premium for automatic Plaid sync</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          }
        </motion.div>

        {/* Category Breakdown (Tier 2+) */}
        {tier !== 'free' && transactions.filter((t) => !t.is_income).length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4">
          
            <CategoryBreakdown transactions={transactions} />
          </motion.div>
        }

        {/* Transaction List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6">
          
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
            </h3>
            <div className="flex gap-1">
              {['all', 'income', 'expense'].map((f) =>
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-lg capitalize transition-colors ${
                filter === f ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`
                }>
                
                  {f}
                </button>
              )}
            </div>
          </div>

          {filtered.length > 0 ?
          <div className="bg-card border border-border rounded-2xl p-2 sm:p-4 divide-y divide-border/50">
              {filtered.map((t) =>
            <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />
            )}
            </div> :

          <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
              <Sparkles className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {transactions.length === 0 ?
              'No transactions yet. Import a CSV or add one manually to get started.' :
              'No transactions match this filter.'}
              </p>
            </div>
          }
        </motion.div>

        {/* Upgrade CTA for free users */}
        {tier === 'free' && transactions.length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5">
          
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Upgrade for more</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              Get smart auto-mapping, category breakdowns, and automatic bank sync with Basic or Premium.
            </p>
            <Link
            to="/pricing"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            
              View plans <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        }
      </div>
    </PullToRefresh>);

}