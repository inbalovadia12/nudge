import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Inbox, Mail, Loader2, Trash2, CheckCheck, Archive, Lock, Shield, X } from 'lucide-react';

const ADMIN_CODE = '12252012Io';
const SESSION_KEY = 'nudigo_admin_unlocked';

export default function AdminPanel({ open, onOpenChange }) {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (open) {
      setUnlocked(sessionStorage.getItem(SESSION_KEY) === 'true');
    }
  }, [open]);

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const res = await base44.functions.invoke('contact-messages', { action: 'list', admin_code: ADMIN_CODE });
      if (res.status === 403) { setForbidden(true); return; }
      setMessages(res.data.messages || []);
    } catch (err) {
      if (err?.response?.status === 403) setForbidden(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (unlocked && open) load();
  }, [unlocked, open, load]);

  function handleUnlock(e) {
    e.preventDefault();
    if (code === ADMIN_CODE) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setUnlocked(true);
      setError('');
      setCode('');
    } else {
      setError('Invalid access code');
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await base44.functions.invoke('contact-messages', { action: 'update_status', message_id: id, status, admin_code: ADMIN_CODE });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    } catch {}
  };

  const deleteMessage = async (id) => {
    try {
      await base44.functions.invoke('contact-messages', { action: 'delete', message_id: id, admin_code: ADMIN_CODE });
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  const newCount = messages.filter(m => m.status === 'new').length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-base font-bold font-heading text-foreground">Admin Panel</h2>
              </div>
              <button onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {!unlocked ? (
                <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Admin Access</h3>
                  <p className="text-sm text-muted-foreground mb-6">Enter the access code to unlock the admin panel.</p>
                  <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-3">
                    <input
                      type="password"
                      value={code}
                      onChange={(e) => { setCode(e.target.value); setError(''); }}
                      placeholder="Enter access code"
                      autoFocus
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-center font-mono"
                    />
                    {error && <p className="text-xs text-danger">{error}</p>}
                    <button type="submit" className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold hover:bg-primary/90 transition-colors">
                      Unlock
                    </button>
                  </form>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : forbidden ? (
                <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <div className="w-16 h-16 rounded-3xl bg-danger/10 flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-danger" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Access denied</h3>
                  <p className="text-sm text-muted-foreground">Your account doesn't have admin permissions.</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Inbox className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                      {newCount > 0 && <span className="text-primary"> · {newCount} new</span>}
                    </p>
                  </div>

                  {messages.length === 0 ? (
                    <div className="text-center py-16">
                      <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border bg-surface-2/50 p-4 ${msg.status === 'new' ? 'border-primary/30' : 'border-border'}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-foreground truncate">{msg.name}</p>
                              {msg.status === 'new' && <span className="text-[9px] font-bold text-primary-foreground bg-primary px-1 py-0.5 rounded-full">NEW</span>}
                            </div>
                            <a href={`mailto:${msg.email}`} className="text-xs text-primary hover:underline">{msg.email}</a>
                          </div>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {new Date(msg.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap mb-2">{msg.message}</p>
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          {msg.status === 'new' && (
                            <button onClick={() => updateStatus(msg.id, 'read')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                              <CheckCheck className="w-3 h-3" /> Read
                            </button>
                          )}
                          {msg.status !== 'archived' && (
                            <button onClick={() => updateStatus(msg.id, 'archived')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-warning transition-colors">
                              <Archive className="w-3 h-3" /> Archive
                            </button>
                          )}
                          <button onClick={() => deleteMessage(msg.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-danger transition-colors ml-auto">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}