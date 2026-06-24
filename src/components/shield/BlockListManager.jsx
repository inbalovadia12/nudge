import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Plus, Trash2, Globe, Smartphone, Shield, Check, Loader2 } from 'lucide-react';

const popularSites = [
  { app_name: 'Amazon', block_url: 'amazon.com', category: 'shopping', app_type: 'website' },
  { app_name: 'eBay', block_url: 'ebay.com', category: 'shopping', app_type: 'website' },
  { app_name: 'Etsy', block_url: 'etsy.com', category: 'shopping', app_type: 'website' },
  { app_name: 'AliExpress', block_url: 'aliexpress.com', category: 'shopping', app_type: 'website' },
  { app_name: 'TikTok Shop', block_url: 'tiktok.com', category: 'social', app_type: 'app' },
  { app_name: 'Instagram', block_url: 'instagram.com', category: 'social', app_type: 'app' },
  { app_name: 'DoorDash', block_url: 'doordash.com', category: 'food', app_type: 'app' },
  { app_name: 'Uber Eats', block_url: 'ubereats.com', category: 'food', app_type: 'app' },
  { app_name: 'Netflix', block_url: 'netflix.com', category: 'entertainment', app_type: 'app' },
  { app_name: 'Target', block_url: 'target.com', category: 'shopping', app_type: 'website' },
];

export default function BlockListManager({ screenTimeConnected, onConnectScreenTime }) {
  const [blockedApps, setBlockedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBlocked();
  }, []);

  async function loadBlocked() {
    try {
      const items = await base44.entities.BlockedApp.filter({ is_active: true });
      setBlockedApps(items);
    } catch {}
    setLoading(false);
  }

  async function toggleBlock(site) {
    const existing = blockedApps.find(b => b.block_url === site.block_url);
    if (existing) {
      await base44.entities.BlockedApp.delete(existing.id);
      setBlockedApps(prev => prev.filter(b => b.id !== existing.id));
    } else {
      const created = await base44.entities.BlockedApp.create({
        app_name: site.app_name,
        block_url: site.block_url,
        category: site.category,
        app_type: site.app_type,
        is_active: true,
        screen_time_blocked: screenTimeConnected
      });
      setBlockedApps(prev => [...prev, created]);
    }
  }

  async function addCustom() {
    if (!customName || !customUrl) return;
    setSaving(true);
    const url = customUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const created = await base44.entities.BlockedApp.create({
      app_name: customName,
      block_url: url,
      category: 'shopping',
      app_type: 'website',
      is_active: true,
      screen_time_blocked: screenTimeConnected
    });
    setBlockedApps(prev => [...prev, created]);
    setCustomName('');
    setCustomUrl('');
    setShowAdd(false);
    setSaving(false);
  }

  async function removeBlocked(id) {
    await base44.entities.BlockedApp.delete(id);
    setBlockedApps(prev => prev.filter(b => b.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Screen Time connection */}
      <div className={`rounded-2xl border p-4 mb-4 transition-all ${screenTimeConnected ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${screenTimeConnected ? 'bg-primary/15' : 'bg-surface-2'}`}>
            <Shield className={`w-5 h-5 ${screenTimeConnected ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Apple Screen Time</p>
            <p className="text-xs text-muted-foreground">
              {screenTimeConnected ? 'Connected — blocked apps will be restricted on your device' : 'Connect to block apps & websites at the device level'}
            </p>
          </div>
          {screenTimeConnected ? (
            <span className="flex items-center gap-1 text-xs text-primary font-medium">
              <Check className="w-3.5 h-3.5" /> Active
            </span>
          ) : (
            <button
              onClick={onConnectScreenTime}
              className="text-xs font-medium text-primary hover:underline px-3 py-1.5 rounded-lg bg-primary/10"
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Blocked apps count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">Blocked apps & sites</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Add custom
        </button>
      </div>

      {/* Custom add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="App or site name"
                className="w-full bg-surface-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="example.com"
                className="w-full bg-surface-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 text-sm text-muted-foreground py-2 rounded-xl hover:bg-surface-2">Cancel</button>
                <button onClick={addCustom} disabled={!customName || !customUrl || saving} className="flex-1 text-sm font-medium text-primary-foreground bg-primary py-2 rounded-xl disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add to blocklist'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popular sites grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {popularSites.map(site => {
          const isBlocked = blockedApps.some(b => b.block_url === site.block_url);
          return (
            <button
              key={site.block_url}
              onClick={() => toggleBlock(site)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${isBlocked ? 'border-primary/30 bg-primary/5' : 'border-border bg-card hover:border-primary/20'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isBlocked ? 'bg-primary/15' : 'bg-surface-2'}`}>
                {site.app_type === 'app' ? <Smartphone className={`w-4 h-4 ${isBlocked ? 'text-primary' : 'text-muted-foreground'}`} /> : <Globe className={`w-4 h-4 ${isBlocked ? 'text-primary' : 'text-muted-foreground'}`} />}
              </div>
              <span className={`text-xs font-medium truncate ${isBlocked ? 'text-primary' : 'text-foreground'}`}>{site.app_name}</span>
              {isBlocked && <Check className="w-3.5 h-3.5 text-primary ml-auto flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Currently blocked list */}
      {blockedApps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">YOUR BLOCKLIST ({blockedApps.length})</p>
          <div className="space-y-1.5">
            {blockedApps.map(app => (
              <div key={app.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                {app.app_type === 'app' ? <Smartphone className="w-4 h-4 text-muted-foreground" /> : <Globe className="w-4 h-4 text-muted-foreground" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{app.app_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{app.block_url}</p>
                </div>
                {screenTimeConnected && app.screen_time_blocked && (
                  <span className="text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">Blocked</span>
                )}
                <button onClick={() => removeBlocked(app.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger/5 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}