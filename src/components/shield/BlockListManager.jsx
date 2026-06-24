import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Globe, Smartphone, Shield, Check, Loader2, Lock, MessageCircleQuestion, Info } from 'lucide-react';
import InterceptionQuestions from './InterceptionQuestions';

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
  const [interceptApp, setInterceptApp] = useState(null);
  const [showBlocked, setShowBlocked] = useState(null);

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
        gate_mode: 'block',
        is_active: true,
        screen_time_blocked: false
      });
      setBlockedApps(prev => [...prev, created]);
    }
  }

  async function setGateMode(appId, mode) {
    const updated = await base44.entities.BlockedApp.update(appId, { gate_mode: mode });
    setBlockedApps(prev => prev.map(b => b.id === appId ? updated : b));
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
      gate_mode: 'block',
      is_active: true,
      screen_time_blocked: false
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

  function handleAppClick(app) {
    if (app.gate_mode === 'intercept') {
      setInterceptApp(app);
    } else {
      setShowBlocked(app);
    }
  }

  function handleInterceptProceed() {
    if (interceptApp) {
      window.open(`https://${interceptApp.block_url}`, '_blank');
    }
    setInterceptApp(null);
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
              {screenTimeConnected
                ? 'Connected — block list syncs to your device via the Nudge iOS companion app'
                : 'Connect to sync your block list with Screen Time (requires iOS companion app)'}
            </p>
          </div>
          {screenTimeConnected ? (
            <span className="flex items-center gap-1 text-xs text-primary font-medium">
              <Check className="w-3.5 h-3.5" /> Synced
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

      {/* Info banner */}
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 mb-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-foreground mb-0.5">Blocking works within Nudge</p>
          <p className="text-xs text-muted-foreground">This blocklist intercepts sites when you check them through Nudge's URL checker. To block sites across your entire browser or device, connect Apple Screen Time above or use a browser extension.</p>
        </div>
      </div>

      {/* Blocked apps count */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">Block Apps & Sites</p>
            <p className="text-xs text-muted-foreground">{blockedApps.length} {blockedApps.length === 1 ? 'item' : 'items'} on your blocklist</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary bg-primary/10 px-4 py-2.5 rounded-xl hover:bg-primary/15 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add custom
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Tap to add or remove. Switch between <span className="font-semibold text-foreground">Block</span> (fully blocked) and <span className="font-semibold text-foreground">Ask Questions</span> (intercept before allowing).</p>

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
      <p className="text-base font-bold text-foreground mb-3">Quick Add</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {popularSites.map(site => {
          const isBlocked = blockedApps.some(b => b.block_url === site.block_url);
          return (
            <button
              key={site.block_url}
              onClick={() => toggleBlock(site)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${isBlocked ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:border-primary/20'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isBlocked ? 'bg-primary/15' : 'bg-surface-2'}`}>
                {site.app_type === 'app' ? <Smartphone className={`w-5 h-5 ${isBlocked ? 'text-primary' : 'text-muted-foreground'}`} /> : <Globe className={`w-5 h-5 ${isBlocked ? 'text-primary' : 'text-muted-foreground'}`} />}
              </div>
              <span className={`text-sm font-semibold truncate ${isBlocked ? 'text-primary' : 'text-foreground'}`}>{site.app_name}</span>
              {isBlocked && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Currently blocked list with gate mode toggle */}
      {blockedApps.length > 0 && (
        <div>
          <p className="text-base font-bold text-foreground mb-3">🛡️ Your Blocklist ({blockedApps.length})</p>
          <div className="space-y-3">
            {blockedApps.map(app => (
              <div key={app.id} className="rounded-2xl border-2 border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
                    {app.app_type === 'app' ? <Smartphone className="w-5 h-5 text-muted-foreground" /> : <Globe className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{app.app_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.block_url}</p>
                  </div>
                  {screenTimeConnected && app.screen_time_blocked && (
                    <span className="text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">Blocked</span>
                  )}
                  <button onClick={() => removeBlocked(app.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger/5 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Gate mode selector */}
                <div className="flex gap-1.5 mt-3 bg-surface-2 rounded-xl p-1">
                  <button
                    onClick={() => setGateMode(app.id, 'block')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${(app.gate_mode || 'block') === 'block' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    <Lock className="w-3.5 h-3.5" /> Block
                  </button>
                  <button
                    onClick={() => setGateMode(app.id, 'intercept')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${app.gate_mode === 'intercept' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    <MessageCircleQuestion className="w-3.5 h-3.5" /> Ask questions
                  </button>
                </div>

                {/* Try opening button */}
                <button
                  onClick={() => handleAppClick(app)}
                  className={`w-full mt-3 text-sm font-semibold py-2 rounded-xl transition-colors ${app.gate_mode === 'intercept' ? 'text-primary bg-primary/10 hover:bg-primary/15' : 'text-danger bg-danger/10 hover:bg-danger/15'}`}
                >
                  Try opening {app.app_name} →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked modal */}
      {showBlocked && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowBlocked(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-danger" />
            </div>
            <h3 className="text-lg font-bold mb-2">Blocked by Nudge</h3>
            <p className="text-sm text-muted-foreground mb-4">This site is on your blocklist. To visit it, remove it from your blocklist or switch to "Ask questions" mode.</p>
            <button onClick={() => setShowBlocked(null)} className="w-full text-sm font-medium py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Go back
            </button>
          </div>
        </div>
      )}

      {/* Interception Questions Modal */}
      {interceptApp && (
        <InterceptionQuestions
          appName={interceptApp.app_name}
          appUrl={interceptApp.block_url}
          onProceed={handleInterceptProceed}
          onBack={() => setInterceptApp(null)}
        />
      )}
    </div>
  );
}