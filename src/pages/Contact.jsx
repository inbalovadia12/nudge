import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicNav from '@/components/public/PublicNav';
import SiteFooter from '@/components/public/SiteFooter';
import { useSeo } from '@/lib/useSeo';
import { Mail, MessageSquare, ArrowRight } from 'lucide-react';

export default function Contact() {
  useSeo({
    title: 'Contact Vesper — Questions, Feedback, Support',
    description: 'Get in touch with the Vesper team. We respond to questions about the app, feature requests, and support inquiries.',
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Vesper contact from ${name || 'a user'}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
    window.location.href = `mailto:hello@vesper.app?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-heading text-foreground mb-3">Contact us</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Have a question about Vesper, a feature request, or need help with your account? We'd love to hear from you. We read every message and do our best to respond within 1–2 business days.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">Email us</p>
            <p className="text-sm text-muted-foreground mt-1">hello@vesper.app</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">In-app chat</p>
            <p className="text-sm text-muted-foreground mt-1">Available inside the app for registered users</p>
          </div>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <p className="text-sm font-bold text-foreground">Thanks for reaching out!</p>
            <p className="text-sm text-muted-foreground mt-1">Your email client should have opened. If not, email us directly at hello@vesper.app.</p>
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary mt-3 hover:underline">
              Back to home <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={5}
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none"
                placeholder="How can we help?"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Send message
            </button>
          </form>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}