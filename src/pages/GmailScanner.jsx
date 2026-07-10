import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { usePremiumStatus, isPremiumUser } from '@/lib/usePremium';
import { formatCurrencyDetailed } from '@/lib/nudgeUtils';
import { Mail, Loader2, Check, RefreshCw, AlertCircle, Lock, ArrowRight, Receipt, CreditCard, Sparkles, Clock, TrendingUp } from 'lucide-react';

const CONNECTOR_ID = '6a50d7b48395c4ecd845b2ff';

export default function GmailScanner() {
  const { profile, loading: profileLoading } = usePremiumStatus();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [canScan, setCanScan] = useState(true);
  const [nextScanTime, setNextScanTime] = useState(null);

  const checkStatus = async () => {
    try {
      const res = await base44.functions.invoke('gmail-receipt-scan', { action: 'status' });
      setConnected(res.data.connected);
      setCanScan(res.data.can_scan);
      setNextScanTime(res.data.next_scan_available);
    } catch {
      setConnected(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!profileLoading) checkStatus();
  }, [profileLoading]);

  const handleConnect = async () => {
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkStatus();
        }
      }, 500);
    } catch {
      setError('Could not start Gmail connection. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setConnected(false);
      setResult(null);
    } catch {
      setError('Could not disconnect Gmail.');
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('gmail-receipt-scan', { action: 'scan' });
      setResult(res.data);
      setCanScan(false);
      setNextScanTime(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
    } catch (err) {
      const data = err?.response?.data;
      if (data?.error === 'daily_limit') {
        setCanScan(false);
        setNextScanTime(data.next_scan_available);
        setError('You have already scanned today. Come back tomorrow!');
      } else if (data?.error === 'Gmail not connected') {
        setConnected(false);
        setError('Gmail is not connected. Please connect first.');
      } else {
        setError(data?.error || 'Scan failed. Please try again.');
      }
    }
    setScanning(false);
  };

  if (profileLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isPremiumUser(profile)) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold font-heading">Gmail Receipt Scanner</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">AI-powered scan for receipts and subscriptions you might have missed</p>

        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">Gmail Receipt Scanner is a Premium feature</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">Upgrade to Premium to let our AI scan your Gmail for receipts and subscription emails you might have missed.</p>
          <Link to="/pricing" className="inline-flex items-center gap-1 text-sm font-medium text-primary-foreground bg-primary px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
            View plans <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold font-heading">Gmail Receipt Scanner</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">AI-powered scan for receipts and subscriptions you might have missed</p>

      {/* Connection card */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Gmail Connection</h2>
          {connected && <span className="text-[10px] font-bold bg-success/10 text-success px-2 py-0.5 rounded-full">Connected</span>}
        </div>

        {!connected ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">Connect your Gmail so Nudigo's AI can scan for receipts and subscription emails you might have missed. We only read emails — we never send or modify anything.</p>
            <button onClick={handleConnect} className="text-sm font-medium text-primary-foreground bg-primary px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Mail className="w-4 h-4" /> Connect Gmail
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Your Gmail is connected and ready to scan.</p>
            <button onClick={handleDisconnect} className="text-xs font-medium text-muted-foreground hover:text-danger transition-colors">
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Scan card */}
      {connected && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">AI Receipt Scan</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Scans your last 7 days of emails for receipts and subscription activity. Limited to once per day.
          </p>

          <button
            onClick={handleScan}
            disabled={scanning || !canScan}
            className="w-full text-sm font-medium text-primary-foreground bg-primary px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {scanning ? 'Scanning your emails...' : canScan ? 'Scan now' : 'Come back tomorrow'}
          </button>

          {!canScan && nextScanTime && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Next scan available {new Date(nextScanTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 mb-6 flex items-start gap-2 text-sm text-danger">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Summary */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">AI Summary</h2>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
            <p className="text-xs text-muted-foreground mt-2">{result.scanned_count} emails scanned</p>
          </div>

          {/* Receipts */}
          {result.receipts?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Receipts Found ({result.receipts.length})</h2>
              </div>
              <div className="space-y-2">
                {result.receipts.map((r, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.merchant}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.email_subject}</p>
                      </div>
                      {r.amount != null && (
                        <p className="text-sm font-semibold flex-shrink-0">{formatCurrencyDetailed(r.amount)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {r.category && <span className="text-[10px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full capitalize">{r.category}</span>}
                      {r.date && <span className="text-[10px] text-muted-foreground">{r.date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscriptions */}
          {result.subscriptions?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Subscription Activity ({result.subscriptions.length})</h2>
              </div>
              <div className="space-y-2">
                {result.subscriptions.map((s, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.email_subject}</p>
                      </div>
                      {s.amount != null && (
                        <p className="text-sm font-semibold flex-shrink-0">{formatCurrencyDetailed(s.amount)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {s.is_trial && <span className="text-[10px] font-medium bg-warning/10 text-warning px-2 py-0.5 rounded-full">Free Trial</span>}
                      {s.billing_cycle && <span className="text-[10px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full capitalize">{s.billing_cycle}</span>}
                      {s.renewal_date && <span className="text-[10px] text-muted-foreground">Renews: {s.renewal_date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.receipts?.length === 0 && result.subscriptions?.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <Check className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No receipts or subscription emails found in the last 7 days.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}