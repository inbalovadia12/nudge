import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicNav from '@/components/public/PublicNav';
import SiteFooter from '@/components/public/SiteFooter';
import { useSeo } from '@/lib/useSeo';
import { ArrowRight, Shield, Target, TrendingDown, Sparkles, Check, Wallet, Brain, Heart } from 'lucide-react';

export default function Landing() {
  useSeo({
    title: 'Nudigo — Personal Finance App for Beginners & Young Adults',
    description: 'Nudigo is a simple personal finance app that helps beginners and young adults manage money through small habits, not complex spreadsheets. Track spending, build savings, and get AI guidance.',
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Personal Finance, Simplified
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-3xl sm:text-5xl font-bold font-heading text-foreground leading-tight max-w-3xl mx-auto">
          Manage your money through habits, not spreadsheets
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-muted-foreground mt-5 max-w-2xl mx-auto leading-relaxed">
          Nudigo is a personal finance app that helps you manage money easily — no jargon, no complex budgets, no guilt. Just simple tools that build better money habits, designed for beginners and young adults starting their financial journey.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link to="/register" className="w-full sm:w-auto bg-primary text-primary-foreground rounded-2xl px-6 py-3.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/blog/manage-money-beginners" className="w-full sm:w-auto border border-border text-foreground rounded-2xl px-6 py-3.5 text-sm font-semibold hover:bg-surface-2 transition-colors">
            Read the beginner's guide
          </Link>
        </motion.div>
        <p className="text-xs text-muted-foreground mt-4">Free to start · No credit card required</p>
      </section>

      {/* What is Nudigo */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold font-heading text-foreground mb-4">What Nudigo is</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Nudigo is a money management app built for people who feel overwhelmed by personal finance. Instead of forcing you to build complex spreadsheets or categorize every transaction, Nudigo focuses on one thing: helping you build better money habits through small, daily actions.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track your spending automatically, set savings goals that actually make sense, and get plain-English guidance from an AI advisor that knows your financial picture. No judgment, no finance degree required.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="space-y-4">
              {[
                { icon: Wallet, title: 'See where your money goes', desc: 'Automatic spending tracking without manual entry' },
                { icon: Target, title: 'Set goals you can reach', desc: 'Savings goals with real progress tracking' },
                { icon: Brain, title: 'Get honest AI guidance', desc: 'Ask any money question, get a straight answer' },
                { icon: Shield, title: 'Block impulse spending', desc: 'Shopping Shield intercepts purchases before you regret them' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-surface-2 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold font-heading text-foreground mb-3">Who Nudigo is for</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Nudigo is designed for beginners and young adults who want to take control of their money without becoming finance experts. Whether you're a student, a recent grad, or just someone who's never felt confident about money, Nudigo meets you where you are.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'Students & young adults', desc: 'Starting your financial life and want to do it right from day one' },
              { title: 'Beginners with money', desc: 'Never been taught how to budget, save, or plan — and ready to learn' },
              { title: 'Impulse spenders', desc: 'Know you spend too much on shopping, food, or subscriptions and want to stop' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 text-left">
                <p className="text-sm font-bold text-foreground mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold font-heading text-foreground mb-2 text-center">How it works</h2>
        <p className="text-sm text-muted-foreground text-center mb-10">Three simple steps. No finance degree required.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Set your goals', desc: 'Tell Nudigo what you\'re saving for — a trip, an emergency fund, paying off debt. Set a target and a timeline.' },
            { step: '2', title: 'Track your money', desc: 'Log purchases or connect your accounts. Nudigo organizes everything automatically and shows you where your money goes.' },
            { step: '3', title: 'Build better habits', desc: 'Get daily guidance, block impulse purchases, and watch your savings grow — one small win at a time.' },
          ].map((item, i) => (
            <div key={i} className="relative rounded-2xl border border-border bg-card p-6">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-4">{item.step}</div>
              <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-surface-2 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold font-heading text-foreground mb-8 text-center">Why people choose Nudigo</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Check, title: 'Clarity over complexity', desc: 'See your full financial picture in plain English — no charts you need a degree to read.' },
              { icon: Heart, title: 'Habits, not restriction', desc: 'Build sustainable money habits through small daily actions instead of crash budgets that fail.' },
              { icon: TrendingDown, title: 'Less stress, more savings', desc: 'Know exactly where you stand and what to do next. No more money anxiety at the end of the month.' },
              { icon: Shield, title: 'Privacy first', desc: 'Your financial data is yours. We never sell it, and we\'re transparent about how everything works.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
        <h2 className="text-2xl font-bold font-heading text-foreground mb-2">Built on trust</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
          We believe finance apps should be transparent. Here's what you can expect from Nudigo:
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {['No selling your data', 'Cancel anytime', 'Transparent pricing', 'Plain-English guidance', 'No hidden fees'].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/20 text-foreground text-sm rounded-full px-4 py-2">
              <Check className="w-3.5 h-3.5 text-primary" /> {item}
            </span>
          ))}
        </div>
      </section>

      {/* Blog / Guides */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold font-heading text-foreground mb-2 text-center">Guides to get you started</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">Free resources to help you understand money management — no app required.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: 'How to Manage Money for Beginners', desc: 'A simple, no-overwhelm guide to taking control of your money.', path: '/blog/manage-money-beginners' },
            { title: 'Why Budgeting Apps Fail', desc: "Why most budgeting apps don't work — and what does instead.", path: '/blog/why-budgeting-apps-fail' },
            { title: 'Simple Money Habits That Stick', desc: 'Small daily habits that actually change how you handle money.', path: '/blog/simple-money-habits' },
          ].map((item, i) => (
            <Link key={i} to={item.path} className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-colors block">
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              <span className="inline-flex items-center gap-1 text-sm text-primary mt-3">Read more <ArrowRight className="w-3.5 h-3.5" /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-8 text-center">
          <h2 className="text-2xl font-bold font-heading text-foreground mb-3">Ready to get started?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">Start building better money habits today. It's free to begin.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-2xl px-6 py-3.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
            Create your free account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}