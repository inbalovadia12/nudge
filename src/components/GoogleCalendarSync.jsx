import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, Loader2, Check, RefreshCw, AlertCircle } from 'lucide-react';

const CONNECTOR_ID = '6a3e1b2f6c2cf1b67f3cebd0';

export default function GoogleCalendarSync() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const checkConnection = async () => {
    try {
      const res = await base44.functions.invoke('sync-bills-to-calendar', { action: 'status' });
      setConnected(true);
      setError('');
    } catch {
      setConnected(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(authed => {
      if (authed) checkConnection();
      else setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkConnection();
        }
      }, 500);
    } catch (err) {
      setError('Could not start Google Calendar connection.');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('sync-bills-to-calendar', { action: 'sync' });
      setResult(res.data);
    } catch (err) {
      setError('Sync failed. Make sure your Google Calendar is connected.');
    }
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">Google Calendar</h2>
        {connected && <span className="text-[10px] font-bold bg-success/10 text-success px-2 py-0.5 rounded-full">Connected</span>}
      </div>

      {!connected ? (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Connect your Google Calendar to automatically add upcoming bills as calendar events with payment reminders.</p>
          <button onClick={handleConnect} className="text-sm font-medium text-primary-foreground bg-primary px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Connect Google Calendar
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Your upcoming bills will be added as all-day events with reminders 1 day and 1 hour before they're due.</p>
          <button onClick={handleSync} disabled={syncing}
            className="text-sm font-medium text-primary-foreground bg-primary px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncing ? 'Syncing...' : 'Sync bills to calendar'}
          </button>

          {result && (
            <div className="mt-3 flex items-center gap-2 text-xs text-success">
              <Check className="w-3.5 h-3.5" />
              <span>{result.synced} bill{result.synced !== 1 ? 's' : ''} synced{result.skipped > 0 ? `, ${result.skipped} already up to date` : ''}</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 text-xs text-danger">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}