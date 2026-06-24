import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Check, Link2, Loader2, Landmark, X } from 'lucide-react';

export default function ConnectPlaid({ connected, onConnected, onDisconnect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.Plaid) return;
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('plaid', { action: 'create_link_token' });
      const linkToken = res.data.link_token;

      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (public_token) => {
          try {
            await base44.functions.invoke('plaid', { action: 'exchange_public_token', public_token });
            setLoading(false);
            if (onConnected) onConnected();
          } catch (err) {
            setLoading(false);
            setError('Failed to save your bank connection. Please try again.');
          }
        },
        onExit: () => {
          setLoading(false);
        },
      });
      handler.open();
    } catch (err) {
      setLoading(false);
      setError('Could not start Plaid Link. Please try again.');
    }
  };

  if (connected) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-success">
          <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <span>Bank connected via Plaid</span>
        </div>
        <button
          onClick={onDisconnect}
          className="text-xs text-muted-foreground hover:text-danger transition-colors flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" /> Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
        ) : (
          <><Landmark className="w-4 h-4" /> Connect your bank</>
        )}
      </button>
      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-danger mt-2 text-center">
          {error}
        </motion.p>
      )}
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Powered by Plaid · Bank-level encryption
      </p>
    </div>
  );
}