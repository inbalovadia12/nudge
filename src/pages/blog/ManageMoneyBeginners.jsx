import { Link } from 'react-router-dom';
import PublicNav from '@/components/public/PublicNav';
import SiteFooter from '@/components/public/SiteFooter';
import { useSeo } from '@/lib/useSeo';
import { ArrowRight } from 'lucide-react';

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I start managing money as a beginner?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Start by tracking what you spend for one month. Then set one savings goal, automate a small transfer to savings, and review your progress weekly. You don't need a complex budget — just awareness and one habit at a time."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a budget to manage my money?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Traditional budgets fail for most beginners because they're rigid and guilt-inducing. Instead of budgeting, focus on building money habits: track spending, set savings goals, and make small consistent improvements."
      }
    },
    {
      "@type": "Question",
      "name": "How much should I save each month?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Start with whatever you can — even $20 or $50 per month. The goal is to build the habit first, then increase the amount over time. Many experts suggest aiming for 20% of income, but any consistent saving is a good start for beginners."
      }
    }
  ]
};

export default function ManageMoneyBeginners() {
  useSeo({
    title: 'How to Manage Money for Beginners (Without Overwhelm)',
    description: 'A simple, step-by-step guide to managing money for beginners. Learn how to track spending, save without a strict budget, and build financial habits that actually stick.',
    schema: FAQ_SCHEMA,
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <nav className="text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/blog/manage-money-beginners" className="text-foreground">Managing Money for Beginners</Link>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4 leading-tight">
          How to Manage Money for Beginners (Without Overwhelm)
        </h1>
        <p className="text-sm text-muted-foreground mb-8">A straightforward guide to taking control of your money — no spreadsheets, no jargon, no guilt.</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-5 text-muted-foreground leading-relaxed">
          <p>
            If you've ever opened a personal finance app and immediately felt overwhelmed, you're not alone. Most money management advice starts with "create a detailed budget" or "categorize every expense" — and that's exactly why so many people give up before they even start.
          </p>
          <p>
            Managing money doesn't have to be complicated. In fact, the simpler your approach, the more likely you are to stick with it. This guide breaks down how to manage money as a beginner without the overwhelm.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Start With Awareness, Not a Budget</h2>
          <p>
            The biggest mistake beginners make is jumping straight into budgeting. Before you decide how much you "should" spend on groceries or entertainment, you need to know what you're actually spending right now.
          </p>
          <p>
            For one month, simply track where your money goes. You don't need to change anything — just observe. Write it down, use an app like <Link to="/" className="text-primary hover:underline">Nudigo</Link>, or review your bank statements. The goal is awareness, not judgment.
          </p>
          <p>
            Most people are surprised by what they find. Those small daily purchases add up fast, and seeing the full picture is the first step toward making better choices — without anyone telling you what to do.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Set One Savings Goal</h2>
          <p>
            Here's where most budgeting advice goes wrong: it tells you to save money but doesn't give you a reason to. Saving for the sake of saving feels like deprivation. Saving for something specific feels like progress.
          </p>
          <p>
            Pick one goal that matters to you. It could be an emergency fund, a trip, paying off a credit card, or even just a buffer so you stop living paycheck to paycheck. Give it a dollar amount and a rough timeline.
          </p>
          <p>
            Now, set up an automatic transfer — even if it's just $20 per paycheck. The amount matters less than the habit. Once saving becomes automatic, you stop having to think about it, and that's when it actually works.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Understand Where Your Money Leaks</h2>
          <p>
            Almost everyone has money leaks — subscriptions they forgot about, recurring charges they don't use, or spending patterns that quietly drain their account. Finding these leaks is one of the fastest ways to free up cash without changing your lifestyle.
          </p>
          <p>
            Review your bank and credit card statements for recurring charges. Cancel anything you haven't used in the last month. Look for patterns: are you spending more on weekends? Do late-night purchases add up? Are you paying for two streaming services when one would do?
          </p>
          <p>
            This isn't about cutting everything you enjoy. It's about spending intentionally — keeping what adds value and cutting what doesn't.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Build Habits, Not Restrictions</h2>
          <p>
            The reason most budgets fail is simple: they feel like a diet. You restrict yourself for a few weeks, feel miserable, then binge-spend and give up entirely.
          </p>
          <p>
            A better approach is to build small, sustainable money habits instead:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-foreground">Check your spending weekly.</strong> A 5-minute review each week keeps you aware without daily tracking fatigue.</li>
            <li><strong className="text-foreground">Wait 24 hours before non-essential purchases.</strong> This single habit eliminates most impulse buys.</li>
            <li><strong className="text-foreground">Automate your savings.</strong> If it happens automatically, you don't have to rely on willpower.</li>
            <li><strong className="text-foreground">Review your subscriptions quarterly.</strong> Services creep up over time — keep only what you use.</li>
          </ul>

          <h2 className="text-xl font-bold text-foreground pt-4">Don't Try to Do Everything at Once</h2>
          <p>
            The biggest trap for beginners is trying to fix everything at once: create a budget, track every expense, start investing, build an emergency fund, pay off debt. That's a recipe for burnout.
          </p>
          <p>
            Instead, pick one thing. Track your spending for a month. Then set a savings goal. Then automate it. Then look for money leaks. Each small step builds on the last, and before you know it, managing money feels natural — not like a chore.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Use Tools That Work With You, Not Against You</h2>
          <p>
            The right tools can make money management feel effortless. <Link to="/" className="text-primary hover:underline">Nudigo</Link> was built specifically for beginners who want to manage money without spreadsheets or guilt. It tracks your spending, helps you set goals, and gives you honest, plain-English guidance — no finance degree required.
          </p>
          <p>
            The key is finding tools that fit your life. If an app makes you feel bad about your spending, it's the wrong app. Good money tools should reduce stress, not add to it.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">The Bottom Line</h2>
          <p>
            Managing money as a beginner doesn't have to be overwhelming. Start with awareness, set one meaningful goal, find your money leaks, and build small habits that compound over time. You don't need a perfect budget — you just need to start.
          </p>
          <p>
            The best time to start was yesterday. The second best time is today.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-xl font-bold font-heading text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">How do I start managing money as a beginner?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Start by tracking what you spend for one month. Then set one savings goal, automate a small transfer to savings, and review your progress weekly. You don't need a complex budget — just awareness and one habit at a time.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">Do I need a budget to manage my money?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">No. Traditional budgets fail for most beginners because they're rigid and guilt-inducing. Instead of budgeting, focus on building money habits: track spending, set savings goals, and make small consistent improvements.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">How much should I save each month?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Start with whatever you can — even $20 or $50 per month. The goal is to build the habit first, then increase the amount over time. Many experts suggest aiming for 20% of income, but any consistent saving is a good start for beginners.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6 text-center">
          <p className="text-base font-bold text-foreground mb-2">Ready to start managing your money?</p>
          <p className="text-sm text-muted-foreground mb-4">Nudigo makes it simple — track spending, set goals, and build habits. Free to start.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-2xl px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors">
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Related articles */}
        <div className="mt-10">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Keep reading</p>
          <div className="space-y-3">
            <Link to="/blog/why-budgeting-apps-fail" className="block rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
              <p className="text-sm font-bold text-foreground">Why Budgeting Apps Fail — and a Better Way</p>
              <p className="text-xs text-muted-foreground mt-1">Why most budgeting apps don't work and what to do instead.</p>
            </Link>
            <Link to="/blog/simple-money-habits" className="block rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
              <p className="text-sm font-bold text-foreground">Simple Money Habits That Actually Stick</p>
              <p className="text-xs text-muted-foreground mt-1">Small daily habits that change how you handle money.</p>
            </Link>
          </div>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}