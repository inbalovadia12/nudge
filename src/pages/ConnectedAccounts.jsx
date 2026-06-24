import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/nudgeUtils';
import { ArrowLeft, Landmark, RefreshCw, Trash2, Loader2, AlertCircle, Check, Building2, Wallet, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

export default function ConnectedAccounts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [recurring, setRecurring] = useState({ subscriptions: [], income: [], bills: [] });
  const [nextPaycheck, setNextPaycheck] = useState(null);
  const [showDisconnect, setShowDisconnect] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const profiles = await base44.entities.UserProfile.list();
      const p = profiles[0];
      setProfile(p);

      if (p?.plaid_access_token) {
        // Sync accounts from Plaid
        const syncRes = await base44.functions.invoke('plaid', { action: 'get_accounts' });
        if (syncRes.data?.accounts) setAccounts(syncRes.data.accounts);

        const recRes = await base44.functions.invoke('plaid', { action: 'get_recurring' });
        if (recRes.data?.recurring) {
          setRecurring({
            subscriptions: recRes.data.recurring.filter(r => r.type === 'subscription'),
            income: recRes.data.recurring.filter(r => r.type === 'income'),
            bills: recRes.data.recurring.filter(r => r.type === 'bill'),
          });
        }
        if (recRes.data?.next_estimated_paycheck) setNextPaycheck(recRes.data.next_estimated_paycheck);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load your connected accounts.');
    }
    setLoading(false);
  }

  async function handleRefresh() {
    setSyncing(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('plaid', { action: 'sync_data' });
      if (res.data?.needs_reconnect) {
        setError('Your bank connection has expired. Please reconnect from your Profile.');
        return;
      }
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Sync failed. Please try again.');
    }
    setSyncing(false);
  }

  async function handleDisconnect() {
    try {
      await base44.functions.invoke('plaid', { action: 'disconnect' });
      navigate('/profile');
    } catch (err) {
      setError('Could not disconnect. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const lastSync = profile?.plaid_last_sync_date
    ? new Date(profile.plaid_last_sync_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Never';

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <button onClick={() => navigate('/profile')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Profile
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Landmark className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold font-heading">Connected Accounts</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{profile?.plaid_institution_name || 'Bank connected via Plaid'}</p>

      {error && (
        <div className="rounded-2xl border-2 border-danger/30 bg-danger/5 p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">{error}</p>
        </div>
      )}

      {/* Sync status bar */}
      <div className="rounded-2xl border border-border bg-card p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Last synced</p>
            <p className="text-sm font-medium">{lastSync}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={syncing}
            className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground bg-primary px-4 py-2 rounded-xl disabled:opacity-60 hover:bg-primary/90 transition-colors"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncing ? 'Syncing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowDisconnect(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-danger border border-danger/30 px-4 py-2 rounded-xl hover:bg-danger/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Disconnect
          </button>
        </div>
      </div>

      {/* Accounts */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> Accounts ({accounts.length})
        </h2>
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.account_id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{acc.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{acc.type} · {acc.subtype || 'account'} ···{acc.mask}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(acc.current_balance)}</p>
                  <p className="text-[10px] text-muted-foreground">Available: {formatCurrency(acc.available_balance)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recurring: Income */}
      {recurring.income.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" /> Recurring Income
          </h3>
          <div className="space-y-2">
            {recurring.income.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.merchant}</p>
                  <p className="text-[10px] text-muted-foreground">Every ~{r.interval_days} days</p>
                </div>
                <span className="text-sm font-semibold text-success">{formatCurrency(Math.abs(r.amount))}</span>
              </div>
            ))}
          </div>
          {nextPaycheck && (
            <div className="mt-3 rounded-xl bg-success/10 border border-success/20 p-3">
              <p className="text-xs text-success font-medium">Est. next paycheck: {new Date(nextPaycheck).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
          )}
        </div>
      )}

      {/* Recurring: Subscriptions */}
      {recurring.subscriptions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-warning" /> Subscriptions
          </h3>
          <div className="space-y-2">
            {recurring.subscriptions.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.merchant}</p>
                  <p className="text-[10px] text-muted-foreground">Monthly</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring: Bills */}
      {recurring.bills.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3">Recurring Bills</h3>
          <div className="space-y-2">
            {recurring.bills.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.merchant}</p>
                  <p className="text-[10px] text-muted-foreground">Every ~{r.interval_days} days</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disconnect confirmation */}
      {showDisconnect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDisconnect(false)}>
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-danger" />
            </div>
            <h3 className="text-lg font-bold mb-2">Disconnect bank?</h3>
            <p className="text-sm text-muted-foreground mb-5">This will remove all synced accounts and transactions. You can reconnect anytime.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDisconnect(false)} className="flex-1 text-sm font-medium py-2.5 rounded-xl bg-secondary hover:bg-secondary/80">Cancel</button>
              <button onClick={handleDisconnect} className="flex-1 text-sm font-medium py-2.5 rounded-xl bg-danger text-danger-foreground hover:bg-danger/90">Disconnect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}