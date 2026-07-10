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
      </div>);

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
      </div>);

  }

  return null;






















































































































































}