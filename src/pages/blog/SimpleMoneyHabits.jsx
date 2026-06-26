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
      "name": "What are the best money habits for beginners?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The best money habits for beginners are: checking spending weekly (not daily), waiting 24 hours before non-essential purchases, automating savings transfers, reviewing subscriptions quarterly, and setting specific savings goals. These habits are sustainable because they require minimal willpower."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to build a money habit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Research suggests it takes anywhere from 18 to 66 days to build a new habit. For money habits, starting small and being consistent matters more than the timeline. Begin with one habit — like a weekly spending check — and add more once it feels automatic."
      }
    },
    {
      "@type": "Question",
      "name": "How do I stop impulse spending?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "To stop impulse spending, use the 24-hour rule: wait a full day before any non-essential purchase. You can also use tools like Thryve's Shopping Shield to intercept purchases, block shopping apps during vulnerable hours, and get AI guidance before buying."
      }
    }
  ]
};

export default function SimpleMoneyHabits() {
  useSeo({
    title: 'Simple Money Habits That Actually Stick | Thryve',
    description: 'Discover small, sustainable money habits that actually work for beginners and young adults. Learn how to build financial habits without willpower or spreadsheets.',
    schema: FAQ_SCHEMA,
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <nav className="text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/blog/simple-money-habits" className="text-foreground">Simple Money Habits</Link>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4 leading-tight">
          Simple Money Habits That Actually Stick
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Forget crash budgets and willpower. These small, sustainable habits can change how you handle money — for good.</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-5 text-muted-foreground leading-relaxed">
          <p>
            Here's the truth about money management that most finance gurus won't tell you: it's not about how much you know. It's about what you do consistently.
          </p>
          <p>
            You don't need to read another book about investing, learn a complex budgeting system, or track every penny. You need a handful of small habits that you can actually maintain — habits that work even when you're tired, busy, or stressed.
          </p>
          <p>
            Here are five simple money habits that actually stick, and how to build them.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Habit 1: The Weekly Money Check-In</h2>
          <p>
            Daily budgeting is exhausting. Weekly check-ins are sustainable. Set aside 5 minutes once a week — maybe Sunday morning with coffee — to look at what you spent and where you stand.
          </p>
          <p>
            You're not judging yourself. You're just staying aware. Awareness is the foundation of every good money habit, because you can't change what you don't see.
          </p>
          <p>
            <strong className="text-foreground">How to build it:</strong> Pick a day and time. Set a recurring reminder. Spend exactly 5 minutes reviewing your spending for the week. That's it. Don't turn it into a 30-minute budgeting session — keep it short and you'll keep doing it.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Habit 2: The 24-Hour Purchase Pause</h2>
          <p>
            Impulse spending is the enemy of financial progress. But trying to "never impulse buy" is like trying to "never eat dessert" — it works until it doesn't, and then you binge.
          </p>
          <p>
            Instead, use the 24-hour rule: for any non-essential purchase, wait 24 hours before buying. If you still want it tomorrow, get it. Most of the time, you won't.
          </p>
          <p>
            This single habit eliminates the majority of regret purchases. The item in your cart, the thing you saw on Instagram, the deal that's "only available today" — 24 hours later, most of it doesn't feel essential.
          </p>
          <p>
            <strong className="text-foreground">How to build it:</strong> When you want to buy something non-essential, add it to a wishlist or cart and close the tab. Set a reminder for 24 hours later. If you still want it, buy it guilt-free. Tools like <Link to="/" className="text-primary hover:underline">Thryve</Link> can even intercept purchases and ask you a few questions before you buy.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Habit 3: Automate Your Savings</h2>
          <p>
            If saving money requires willpower, it won't last. The secret to consistent saving is to remove willpower from the equation entirely.
          </p>
          <p>
            Set up an automatic transfer from your checking to your savings account — even if it's just $25 per paycheck. The amount doesn't matter at first. What matters is that it happens without you thinking about it.
          </p>
          <p>
            Once saving is automatic, it becomes invisible. You don't miss what you never see. And over time, those small transfers add up to real savings — without a single moment of discipline.
          </p>
          <p>
            <strong className="text-foreground">How to build it:</strong> Log into your bank. Set up a recurring transfer for payday. Start small — $20 or $50. Increase it by $10 every few months. You won't notice the difference, but your savings will grow.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Habit 4: The Subscription Sweep</h2>
          <p>
            Subscriptions are the silent budget killers. They're small enough that you don't notice them individually, but they add up to hundreds or thousands of dollars per year. And most people pay for services they barely use.
          </p>
          <p>
            Every three months, do a subscription sweep. Review every recurring charge on your credit card and bank statement. Cancel anything you haven't used in the last 30 days. Keep what you actually use. It's that simple.
          </p>
          <p>
            <strong className="text-foreground">How to build it:</strong> Set a quarterly calendar reminder. Spend 15 minutes reviewing your statements. Cancel what you don't use. This habit alone can save you $200–$500 per year with almost zero effort.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Habit 5: Set Goals That Mean Something</h2>
          <p>
            Saving for "the future" or "emergencies" is abstract and unmotivating. Saving for a specific thing — a trip to Japan, a reliable car, three months of rent in an emergency fund — gives your money purpose.
          </p>
          <p>
            When you have a specific goal, saving feels like progress toward something you want. When you don't, it feels like deprivation. That's the difference between sustainable saving and crash saving.
          </p>
          <p>
            <strong className="text-foreground">How to build it:</strong> Pick one goal. Give it a dollar amount and a rough timeline. Track your progress visually — a progress bar, a ring, anything that shows you getting closer. Apps like <Link to="/" className="text-primary hover:underline">Thryve</Link> make this easy with visual goal tracking.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">How to Actually Make Habits Stick</h2>
          <p>
            Knowing the right habits is easy. Building them is hard. Here are a few principles that make money habits actually stick:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-foreground">Start with one habit.</strong> Don't try to build five habits at once. Pick one, do it for a month, then add another.</li>
            <li><strong className="text-foreground">Keep it small.</strong> 5 minutes is better than 30 minutes, because you'll actually do it.</li>
            <li><strong className="text-foreground">Attach it to something you already do.</strong> Review spending while you drink your Sunday coffee. Check subscriptions when you pay your monthly bills.</li>
            <li><strong className="text-foreground">Use tools that reduce friction.</strong> Apps that automate tracking, intercept purchases, and visualize progress make habits easier to maintain.</li>
            <li><strong className="text-foreground">Don't be perfect.</strong> Missed a week? Just start again. Consistency over time beats perfection.</li>
          </ul>

          <h2 className="text-xl font-bold text-foreground pt-4">The Bottom Line</h2>
          <p>
            Good money management isn't about knowledge or willpower — it's about habits. Small, consistent actions that you can maintain for years, not weeks.
          </p>
          <p>
            Start with one habit. A weekly check-in, a 24-hour purchase pause, an automated savings transfer. Build it until it's automatic, then add the next one. Over time, these small habits compound into real financial progress — no spreadsheet required.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-xl font-bold font-heading text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">What are the best money habits for beginners?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">The best money habits for beginners are: checking spending weekly (not daily), waiting 24 hours before non-essential purchases, automating savings transfers, reviewing subscriptions quarterly, and setting specific savings goals. These habits are sustainable because they require minimal willpower.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">How long does it take to build a money habit?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Research suggests it takes anywhere from 18 to 66 days to build a new habit. For money habits, starting small and being consistent matters more than the timeline. Begin with one habit — like a weekly spending check — and add more once it feels automatic.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">How do I stop impulse spending?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">To stop impulse spending, use the 24-hour rule: wait a full day before any non-essential purchase. You can also use tools like Thryve's Shopping Shield to intercept purchases, block shopping apps during vulnerable hours, and get AI guidance before buying.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6 text-center">
          <p className="text-base font-bold text-foreground mb-2">Build better money habits with Thryve</p>
          <p className="text-sm text-muted-foreground mb-4">Track spending, set goals, intercept impulse buys, and get AI guidance. Free to start.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-2xl px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors">
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Related articles */}
        <div className="mt-10">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Keep reading</p>
          <div className="space-y-3">
            <Link to="/blog/manage-money-beginners" className="block rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
              <p className="text-sm font-bold text-foreground">How to Manage Money for Beginners (Without Overwhelm)</p>
              <p className="text-xs text-muted-foreground mt-1">A simple, step-by-step guide to taking control of your money.</p>
            </Link>
            <Link to="/blog/why-budgeting-apps-fail" className="block rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
              <p className="text-sm font-bold text-foreground">Why Budgeting Apps Fail — and a Better Way</p>
              <p className="text-xs text-muted-foreground mt-1">Why most budgeting apps don't work and what to do instead.</p>
            </Link>
          </div>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}