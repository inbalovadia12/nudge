import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useSeo } from '@/lib/useSeo';
import { Inbox, Mail, Loader2, Trash2, CheckCheck, Archive, ArrowLeft, Shield } from 'lucide-react';

export default function AdminMessages() {
  useSeo({ title: 'Admin — Contact Messages', description: 'Admin contact message inbox' });

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const res = await base44.functions.invoke('contact-messages', { action: 'list' });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      setMessages(res.data.messages || []);
    } catch (err) {
      if (err?.response?.status === 403) {
        setForbidden(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await base44.functions.invoke('contact-messages', { action: 'update_status', message_id: id, status });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
      setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
    } catch {}
  };

  const deleteMessage = async (id) => {
    try {
      await base44.functions.invoke('contact-messages', { action: 'delete', message_id: id });
      setMessages(prev => prev.filter(m => m.id !== id));
      setSelected(null);
    } catch {}
  };

  const newCount = messages.filter(m => m.status === 'new').length;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto min-h-screen flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-danger/10 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-danger" />
        </div>
        <h1 className="text-xl font-bold font-heading mb-2">Access denied</h1>
        <p className="text-sm text-muted-foreground mb-6">You don't have permission to view this page.</p>
        <Link to="/" className="text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/15 transition-colors">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-24 lg:pb-6">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold font-heading">Contact Messages</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {messages.length} total {messages.length === 1 ? 'message' : 'messages'}
            {newCount > 0 && <span className="text-primary font-medium"> · {newCount} new</span>}
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-20">
            <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Contact form submissions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                  className={`rounded-2xl border bg-card p-4 ${msg.status === 'new' ? 'border-primary/30' : 'border-border'}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground truncate">{msg.name}</p>
                        {msg.status === 'new' && (
                          <span className="text-[10px] font-bold text-primary-foreground bg-primary px-1.5 py-0.5 rounded-full">NEW</span>
                        )}
                        {msg.status === 'read' && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">READ</span>
                        )}
                        {msg.status === 'archived' && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">ARCHIVED</span>
                        )}
                      </div>
                      <a href={`mailto:${msg.email}`} className="text-xs text-primary hover:underline">{msg.email}</a>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {new Date(msg.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    {msg.status === 'new' && (
                      <button onClick={() => updateStatus(msg.id, 'read')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                        <CheckCheck className="w-3.5 h-3.5" /> Mark read
                      </button>
                    )}
                    {msg.status !== 'archived' && (
                      <button onClick={() => updateStatus(msg.id, 'archived')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-warning transition-colors">
                        <Archive className="w-3.5 h-3.5" /> Archive
                      </button>
                    )}
                    {msg.status === 'archived' && (
                      <button onClick={() => updateStatus(msg.id, 'read')} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                        <CheckCheck className="w-3.5 h-3.5" /> Restore
                      </button>
                    )}
                    <button onClick={() => deleteMessage(msg.id)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-danger transition-colors ml-auto">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
    </div>
  );
}