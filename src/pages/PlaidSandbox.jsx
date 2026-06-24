import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/nudgeUtils';
import { ArrowLeft, Bug, CheckCircle2, XCircle, Loader2, RefreshCw, Building2, Receipt, Landmark } from 'lucide-react';

export default function PlaidSandbox() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('plaid', { action: 'get_status' });
      setStatus(res.data);
      if (res.data.connected) {
        const accRes = await base44.functions.invoke('plaid', { action: 'get_accounts' });
        if (accRes.data?.accounts) setAccounts(accRes.data.accounts);
        const profiles = await base44.entities.UserProfile.list();
        const start = profiles[0] ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined;
        const txnRes = await base44.functions.invoke('plaid', { action: 'get_transactions', start_date: start });
        if (txnRes.data?.transactions) setTransactions(txnRes.data.transactions);
      }
    } catch {}
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await base44.functions.invoke('plaid', { action: 'sync_data' });
      await loadStatus();
    } catch {}
    setSyncing(false);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <button onClick={() => navigate('/profile')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Profile
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Bug className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold font-heading">Plaid Sandbox</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Development & debugging panel for Plaid integration</p>

      {/* Connection Status */}
      <div className={`rounded-2xl border-2 p-5 mb-6 ${status?.connected ? 'border-success/30 bg-success/5' : 'border-border bg-card'}`}>
        <div className="flex items-center gap-3 mb-3">
          {status?.connected ? (
            <CheckCircle2 className="w-6 h-6 text-success" />
          ) : (
            <XCircle className="w-6 h-6 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-bold text-foreground">{status?.connected ? 'Connected' : 'Not Connected'}</p>
            <p className="text-xs text-muted-foreground">Environment: <span className="font-mono">{status?.env || 'unknown'}</span></p>
          </div>
        </div>
        {status?.connected && (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Institution: <span className="text-foreground font-medium">{status.institution_name}</span></p>
            <p>Last sync: <span className="text-foreground font-medium">{status.last_sync ? new Date(status.last_sync).toLocaleString() : 'Never'}</span></p>
          </div>
        )}
      </div>

      {/* Quick stats */}
      {status?.connected && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Accounts</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
            <p className="text-[10px] text-muted-foreground">synced from Plaid</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Receipt className="w-4 h-4 text-primary" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Transactions</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
            <p className="text-[10px] text-muted-foreground">last 30 days</p>
          </div>
        </div>
      )}

      {/* Sync button */}
      {status?.connected && (
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold disabled:opacity-60 hover:bg-primary/90 transition-colors mb-6"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {syncing ? 'Syncing...' : 'Full Data Sync'}
        </button>
      )}

      {/* Accounts detail */}
      {accounts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3">Accounts</h3>
          <div className="space-y-2">
            {accounts.map(acc => (
              <div key={acc.account_id} className="rounded-xl border border-border bg-card p-3 font-mono text-xs">
                <div className="flex justify-between mb-1">
                  <span className="font-sans font-medium text-foreground">{acc.name}</span>
                  <span className="font-sans font-bold text-foreground">{formatCurrency(acc.current_balance)}</span>
                </div>
                <div className="text-muted-foreground">
                  id: {acc.account_id} | type: {acc.type} | subtype: {acc.subtype} | mask: ···{acc.mask}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest transactions */}
      {transactions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3">Latest Transactions</h3>
          <div className="space-y-2">
            {transactions.slice(0, 10).map(t => (
              <div key={t.transaction_id} className="rounded-xl border border-border bg-card p-3 font-mono text-xs">
                <div className="flex justify-between mb-1">
                  <span className="font-sans font-medium text-foreground">{t.merchant_name || t.name}</span>
                  <span className={`font-sans font-bold ${t.amount > 0 ? 'text-danger' : 'text-success'}`}>{formatCurrency(t.amount)}</span>
                </div>
                <div className="text-muted-foreground">
                  {t.date} | {t.category || 'uncategorized'} | id: {t.transaction_id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!status?.connected && (
        <div className="text-center py-8">
          <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No bank connected. Go to Profile to connect.</p>
        </div>
      )}
    </div>
  );
}