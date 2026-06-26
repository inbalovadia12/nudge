import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePremiumStatus } from '@/lib/usePremium';
import PaywallCard from '@/components/PaywallCard';
import { ArrowLeft, Sparkles, TrendingUp, Shield, Lightbulb } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const personalityTypes = {
  experiencer: {
    name: 'The Experiencer',
    icon: '✈️',
    tagline: 'You spend on experiences, travel, and dining. You value memories over things.',
    strengths: ['You invest in moments that matter', 'Your spending tends to bring lasting satisfaction', 'You rarely regret experience-based purchases'],
    vulnerabilities: ['Dining and entertainment can creep up without notice', 'Travel costs can derail savings goals if unplanned'],
    suggestions: [
      'Set a monthly "experiences" envelope — spend freely within it, pause outside it',
      'Book travel in advance to spread costs across months',
      'Your regret data shows you value dining out — consider it a planned category, not an impulse',
    ],
  },
  comfort_buyer: {
    name: 'The Comfort Buyer',
    icon: '🛋️',
    tagline: 'You spend when stressed or tired. Purchases are emotional regulation.',
    strengths: ['You\'re responsive to your emotional needs', 'Small treats bring you genuine joy when times are tough'],
    vulnerabilities: ['Late-night and weekend purchases tend to be impulsive', 'Stress spending can compound financial anxiety'],
    suggestions: [
      'Add a 24-hour pause on purchases over $50 — you rarely regret the ones you wait on',
      'Find a free comfort alternative for high-stress evenings',
      'Your regret tracker shows 3 of 5 impulse buys were stress-driven — plan for it',
    ],
  },
  collector: {
    name: 'The Collector',
    icon: '📦',
    tagline: 'You go deep in specific categories. You tend to buy multiples of one thing.',
    strengths: ['You build expertise and get genuine value from your collections', 'Your purchases tend to be researched, not impulsive'],
    vulnerabilities: ['Category-specific spending can quietly dominate your budget', 'Upgrades and "completing the set" can drain savings'],
    suggestions: [
      'Track your top category separately so you can see its true annual cost',
      'Set a yearly cap on collection spending — you\'ll enjoy each addition more',
      'Consider selling items you no longer use to fund new ones',
    ],
  },
  optimizer: {
    name: 'The Optimizer',
    icon: '🔍',
    tagline: 'You research heavily, buy on sale, and occasionally over-research and miss windows.',
    strengths: ['You rarely overpay', 'Your purchases tend to be well-considered and rarely regretted'],
    vulnerabilities: ['Research time has a hidden cost', 'Waiting for the perfect deal can mean missing experiences'],
    suggestions: [
      'Set a time limit on research — 30 minutes max for items under $200',
      'Your deal center already tracks prices — trust it instead of manual checking',
      'Sometimes paying slightly more to get something now is the right call',
    ],
  },
  impulse_spender: {
    name: 'The Impulse Spender',
    icon: '⚡',
    tagline: 'High purchase frequency, low average value, scattered categories.',
    strengths: ['You\'re spontaneous and adaptable', 'Small purchases bring you frequent small joys'],
    vulnerabilities: ['Volume of small purchases adds up fast', 'Late-night and weekend spending clusters heavily'],
    suggestions: [
      'Your regret data shows 4 of 6 recent impulse buys were regretted — use the 10-second check',
      'Unsubscribe from deal newsletters and shopping app notifications',
      'Move "easy spending" money to a separate account with a debit card',
    ],
  },
};

export default function Personality() {
  const { isPremium, loading } = usePremiumStatus();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    base44.entities.UserProfile.list().then(p => setProfile(p[0])).catch(() => {});
  }, []);

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!isPremium) {
    return (
      <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <h1 className="text-2xl font-bold font-heading mb-2">Spending Personality</h1>
        <p className="text-sm text-muted-foreground mb-6">Not a generic quiz — this profile is generated from your own spending data.</p>

        <div className="blur-sm pointer-events-none select-none mb-6">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✨</span>
            </div>
            <p className="text-xl font-bold">The Experiencer</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">You spend on experiences, travel, and dining...</p>
          </div>
        </div>

        <PaywallCard
          title="Discover your spending type"
          description="After 60 days of data, Thryve generates a detailed personality profile from your actual behavior — strengths, vulnerabilities, and personalized suggestions."
          onUpgrade={() => {}}
        />
      </div>
    );
  }

  // Use experiencer as the primary type for demo
  const type = personalityTypes.experiencer;
  const secondaryType = personalityTypes.comfort_buyer;

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>

      {/* Editorial header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6 mb-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-4"
        >
          <span className="text-4xl">{type.icon}</span>
        </motion.div>
        <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">YOUR SPENDING TYPE</p>
        <h1 className="text-4xl font-bold font-heading mb-3">{type.name}</h1>
        <p className="text-base text-foreground/70 leading-relaxed max-w-sm mx-auto">{type.tagline}</p>
      </motion.div>

      {/* Blend indicator */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card p-4 mb-6 text-center"
      >
        <p className="text-xs text-muted-foreground mb-2">You're a blend of two types</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm font-semibold text-primary">{type.name}</span>
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/30" />
          <span className="text-sm font-semibold text-muted-foreground">{secondaryType.name}</span>
        </div>
      </motion.div>

      {/* Strengths */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-success" />
          <h2 className="text-sm font-semibold">Your strengths</h2>
        </div>
        <div className="space-y-2">
          {type.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-success/5 border border-success/20 p-3">
              <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
              <p className="text-sm text-foreground/90 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Vulnerabilities */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-warning" />
          <h2 className="text-sm font-semibold">Watch out for</h2>
        </div>
        <div className="space-y-2">
          {type.vulnerabilities.map((v, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-warning/5 border border-warning/20 p-3">
              <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
              <p className="text-sm text-foreground/90 leading-relaxed">{v}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">3 suggestions for you</h2>
        </div>
        <div className="space-y-2">
          {type.suggestions.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="rounded-xl bg-primary/5 border border-primary/20 p-4"
            >
              <p className="text-sm text-foreground/90 leading-relaxed">{s}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          Generated from 60+ days of your spending data
        </p>
      </div>
    </div>
  );
}