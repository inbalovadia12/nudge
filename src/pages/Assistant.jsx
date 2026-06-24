import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { getFinancialContext, buildContextString, buildNudgeSystemPrompt } from '@/lib/nudgeUtils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ConversationList from '@/components/assistant/ConversationList';
import { Send, Mic, Sparkles, Menu } from 'lucide-react';

const NUDGE_GREETING = "Hey — I'm Nudge. Ask me anything about your spending, your goals, or whether something's worth buying. No judgment, just an honest read.";

export default function Assistant() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) loadMessages(activeConvId);
  }, [activeConvId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function loadConversations() {
    try {
      const convs = await base44.entities.Conversation.list('-updated_date', 50);
      if (convs.length === 0) {
        const conv = await base44.entities.Conversation.create({
          title: 'New chat',
          last_message_preview: '',
          last_activity_date: new Date().toISOString(),
        });
        setConversations([conv]);
        setActiveConvId(conv.id);
      } else {
        setConversations(convs);
        setActiveConvId(convs[0].id);
      }
    } catch {
      setActiveConvId('default');
    }
  }

  async function loadMessages(convId) {
    try {
      const data = await base44.entities.ChatMessage.filter({ conversation_id: convId });
      if (data.length === 0 && convId !== 'default') {
        const greeting = await base44.entities.ChatMessage.create({
          conversation_id: convId,
          role: 'assistant',
          content: NUDGE_GREETING,
        });
        setMessages([greeting]);
      } else {
        setMessages(data.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      }
    } catch {
      setMessages([]);
    }
  }

  async function createNewConversation() {
    try {
      const conv = await base44.entities.Conversation.create({
        title: 'New chat',
        last_message_preview: '',
        last_activity_date: new Date().toISOString(),
      });
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      setShowConversations(false);
    } catch {}
  }

  async function deleteConversation(convId) {
    try {
      const msgs = await base44.entities.ChatMessage.filter({ conversation_id: convId });
      await Promise.all(msgs.map(m => base44.entities.ChatMessage.delete(m.id)));
      await base44.entities.Conversation.delete(convId);
      const remaining = conversations.filter(c => c.id !== convId);
      if (remaining.length > 0) {
        setConversations(remaining);
        setActiveConvId(remaining[0].id);
      } else {
        createNewConversation();
      }
    } catch {}
  }

  function selectConversation(convId) {
    setActiveConvId(convId);
    setShowConversations(false);
  }

  async function updateConversationMeta(convId, preview) {
    try {
      await base44.entities.Conversation.update(convId, {
        last_message_preview: preview.substring(0, 100),
        last_activity_date: new Date().toISOString(),
      });
      setConversations(prev => prev.map(c =>
        c.id === convId
          ? { ...c, last_message_preview: preview.substring(0, 100), last_activity_date: new Date().toISOString() }
          : c
      ).sort((a, b) => new Date(b.last_activity_date || b.updated_date) - new Date(a.last_activity_date || a.updated_date)));
    } catch {}
  }

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const handleSend = async (text) => {
    const message = (text || input).trim();
    if (!message || loading || !activeConvId) return;

    const userMsg = await base44.entities.ChatMessage.create({
      conversation_id: activeConvId,
      role: 'user',
      content: message,
    });
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Auto-title the conversation from first message
    const conv = conversations.find(c => c.id === activeConvId);
    if (conv && (conv.title === 'New chat' || !conv.title)) {
      const newTitle = message.length > 35 ? message.substring(0, 35) + '...' : message;
      try {
        await base44.entities.Conversation.update(activeConvId, { title: newTitle });
        setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, title: newTitle } : c));
      } catch {}
    }
    updateConversationMeta(activeConvId, message);

    try {
      const ctx = await getFinancialContext();
      const contextString = buildContextString(ctx);
      const recentHistory = messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');

      const systemPrompt = buildNudgeSystemPrompt(contextString, {
        extraRules: `Recent conversation:\n${recentHistory}\n\nThe user's latest message: ${message}\n\nRespond as Nudge:`,
      });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: systemPrompt,
        model: 'claude_sonnet_4_6',
      });

      const aiContent = typeof response === 'string' ? response : (response?.content || String(response));
      const aiMsg = await base44.entities.ChatMessage.create({
        conversation_id: activeConvId,
        role: 'assistant',
        content: aiContent,
      });
      setMessages(prev => [...prev, aiMsg]);
      updateConversationMeta(activeConvId, aiContent);
    } catch (err) {
      const errMsg = await base44.entities.ChatMessage.create({
        conversation_id: activeConvId,
        role: 'assistant',
        content: "I'm having trouble right now. Mind trying again in a moment?",
      });
      setMessages(prev => [...prev, errMsg]);
    }
    setLoading(false);
  };

  const suggestions = [
    'Can I afford a $200 jacket?',
    'How am I doing this month?',
    'Am I on track for my goal?',
  ];

  return (
    <div className="flex h-screen lg:h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border bg-card p-4 flex-shrink-0">
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={selectConversation}
          onNew={createNewConversation}
          onDelete={deleteConversation}
        />
      </aside>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="p-4 lg:p-6 pb-2">
          <div className="flex items-center gap-3">
            <Sheet open={showConversations} onOpenChange={setShowConversations}>
              <SheetTrigger asChild>
                <button className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors flex-shrink-0">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-4">
                <SheetHeader>
                  <SheetTitle>Conversations</SheetTitle>
                </SheetHeader>
                <div className="mt-4 h-[calc(100%-3rem)]">
                  <ConversationList
                    conversations={conversations}
                    activeId={activeConvId}
                    onSelect={selectConversation}
                    onNew={createNewConversation}
                    onDelete={deleteConversation}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground">Nudge</h1>
              <p className="text-xs text-muted-foreground">Ask me anything — no judgment.</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6 pb-4 scrollbar-thin">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-1 border border-border text-foreground'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{msg.content}</ReactMarkdown>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-1 border border-border rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-4">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-sm bg-surface-1 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 rounded-full px-4 py-2 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 lg:p-6 bg-canvas border-t border-border">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-surface-1 border border-border rounded-2xl pr-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm min-w-0"
              />
              <button
                onClick={handleVoice}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${listening ? 'bg-primary/10' : 'hover:bg-surface-2'}`}
              >
                <Mic className={`w-4 h-4 ${listening ? 'text-primary' : 'text-muted-foreground'}`} />
              </button>
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
            >
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}