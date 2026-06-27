import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicNav from '@/components/public/PublicNav';
import SiteFooter from '@/components/public/SiteFooter';
import { useSeo } from '@/lib/useSeo';
import { ArrowRight, Target, Users, Shield } from 'lucide-react';

export default function About() {
  useSeo({
    title: 'About Nudigo — Why We Built a Simpler Finance App',
    description: 'Nudigo was built to make money management simple for beginners and young adults. Learn about our mission to replace complex budgeting with sustainable habits.',
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-heading text-foreground mb-4">About Nudigo</h1>
        </motion.div>

        <div className="prose prose-invert prose-sm max-w-none space-y-5 text-muted-foreground leading-relaxed">
          <p>
            Nudigo started with a simple observation: most personal finance apps are built for people who already love spreadsheets. They assume you know what a "category" is, that you'll log every coffee, and that you'll stick to a rigid budget month after month.
          </p>
          <p>
            But that's not how most people interact with money. Real people — students, young professionals, parents — don't need another app that makes them feel guilty about spending $4 on a latte. They need tools that help them build better habits without becoming a finance expert.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Our mission</h2>
          <p>
            We're on a mission to make money management accessible to everyone — especially beginners and young adults who were never taught how to handle money. We believe financial wellness shouldn't require a degree, a spreadsheet, or a guilt trip.
          </p>
          <p>
            Instead of complex budgets, Nudigo focuses on habits: small, sustainable actions that add up over time. Track your spending, set goals that matter to you, get honest guidance when you need it, and build confidence with every small win.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Why we built it</h2>
          <p>
            We watched friends and family struggle with the same problems: not knowing where their money went, feeling anxious about purchases, setting budgets they couldn't keep, and using finance apps that felt like homework.
          </p>
          <p>
            The tools on the market either did too little (basic expense trackers) or too much (complex budgeting systems that took hours to maintain). Nothing felt like it was built for someone just starting out.
          </p>
          <p>
            So we built Nudigo to be the middle ground — powerful enough to actually help, simple enough that you'll actually use it.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">What we believe</h2>
          <div className="grid gap-4 not-prose py-2">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Habits beat budgets</p>
                <p className="text-sm text-muted-foreground mt-1">Sustainable money habits work better than crash budgets. Small daily actions compound over time.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Built for real people</p>
                <p className="text-sm text-muted-foreground mt-1">Not for accountants. If you've never been taught how to manage money, Nudigo is designed for you.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Your data is yours</p>
                <p className="text-sm text-muted-foreground mt-1">We never sell your financial data. Transparency isn't a feature — it's the baseline.</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground pt-4">Get started</h2>
          <p>
            Ready to take control of your money without the overwhelm? Nudigo is free to start. No credit card, no commitment, no judgment.
          </p>
          <div className="not-prose">
            <Link to="/register" className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-2xl px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors">
              Create your free account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}