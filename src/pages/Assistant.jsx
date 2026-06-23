import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { getFinancialContext, buildContextString } from '@/lib/nudgeUtils';
import { Send, Mic, Sparkles } from 'lucide-react';

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const loadMessages = async () => {
    const data = await base44.entities.ChatMessage.filter({ conversation_id: 'default' });
    if (data.length === 0) {
      const greeting = await base44.entities.ChatMessage.create({
        conversation_id: 'default',
        role: 'assistant',
        content: 'Hey — I\'m Nudge. Ask me anything about your spending, your goals, or whether something\'s worth buying. No judgment, just an honest read.'
      });
      setMessages([greeting]);
    } else {
      setMessages(data.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    }
  };

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
    if (!message || loading) return;

    const userMsg = await base44.entities.ChatMessage.create({
      conversation_id: 'default',
      role: 'user',
      content: message
    });
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const ctx = await getFinancialContext();
      const contextString = buildContextString(ctx);
      const recentHistory = messages.slice(-8).map(m => `${m.role}: ${m.content}`).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Nudge, a calm AI purchase coach. You're having a conversation with the user about their finances.

Financial context: ${contextString}

Recent conversation:
${recentHistory}

User's latest message: ${message}

Tone rules (STRICTLY ENFORCED):
- NEVER use the word "budget"
- NEVER say "you should" — offer options, not commands
- Say "here's what I noticed" or "here's an option"
- Explain every number you give
- If you don't know something, say so rather than guessing
- Speak like a calm, knowledgeable friend — not a financial advisor
- Use "you" not "the user"
- Keep responses concise (under 150 words) and warm
- Reference their savings goal when relevant
- If asked "can I afford this", give a direct, honest answer with context

Respond as Nudge:`
      });

      const aiMsg = await base44.entities.ChatMessage.create({
        conversation_id: 'default',
        role: 'assistant',
        content: response
      });
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errMsg = await base44.entities.ChatMessage.create({
        conversation_id: 'default',
        role: 'assistant',
        content: 'I\'m having trouble right now. Mind trying again in a moment?'
      });
      setMessages(prev => [...prev, errMsg]);
    }
    setLoading(false);
  };

  const suggestions = [
    'Can I afford a $200 jacket?',
    'How am I doing this month?',
    'Am I on track for my goal?'
  ];

  return (
    <div className="flex flex-col h-screen lg:h-screen">
      {/* Header */}
      <div className="p-6 lg:p-10 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Assistant</h1>
            <p className="text-xs text-muted-foreground">Ask me anything — no judgment.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 lg:px-10 pb-4 no-scrollbar">
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
                  <p className="text-sm">{msg.content}</p>
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

          {/* Suggestions */}
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
              className="flex-1 bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm"
            />
            <button
              onClick={handleVoice}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${listening ? 'bg-primary/10' : 'hover:bg-surface-2'}`}
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
  );
}