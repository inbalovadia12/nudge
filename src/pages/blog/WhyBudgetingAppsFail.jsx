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
      "name": "Why do budgeting apps fail for most people?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Budgeting apps fail because they require too much manual effort, use rigid categories that don't match real life, make users feel guilty about spending, and focus on restriction instead of habit-building. Most people abandon them within 2-3 months."
      }
    },
    {
      "@type": "Question",
      "name": "What's a better alternative to traditional budgeting?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Instead of rigid budgets, use a habit-based approach: track spending automatically, set meaningful savings goals, automate your savings, review weekly, and use tools that provide guidance rather than guilt. Apps like Thryve are built around this approach."
      }
    },
    {
      "@type": "Question",
      "name": "Can I manage money without a spreadsheet?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely. Spreadsheets are powerful but require manual maintenance and discipline. Modern finance apps can track spending automatically, categorize transactions, and give you insights without ever opening a spreadsheet."
      }
    }
  ]
};

export default function WhyBudgetingAppsFail() {
  useSeo({
    title: 'Why Budgeting Apps Fail — and a Better Way | Thryve',
    description: 'Most budgeting apps fail within months. Learn why traditional budgeting doesn\'t work and discover a simpler, habit-based approach to managing money without spreadsheets.',
    schema: FAQ_SCHEMA,
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <nav className="text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/blog/why-budgeting-apps-fail" className="text-foreground">Why Budgeting Apps Fail</Link>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4 leading-tight">
          Why Budgeting Apps Fail — and a Better Way
        </h1>
        <p className="text-sm text-muted-foreground mb-8">The problem isn't you. It's the tools. Here's why most budgeting apps get abandoned — and what actually works instead.</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-5 text-muted-foreground leading-relaxed">
          <p>
            If you've ever downloaded a budgeting app, used it enthusiastically for two weeks, and then never opened it again — you're in good company. Studies suggest that the vast majority of personal finance apps are abandoned within the first 90 days.
          </p>
          <p>
            The problem isn't a lack of discipline. The problem is that most budgeting apps are designed for a type of person who doesn't exist: someone who loves categorizing transactions, updating spreadsheets, and sticking to rigid monthly limits.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Reason 1: They Require Too Much Manual Effort</h2>
          <p>
            The average budgeting app asks you to manually log every purchase, assign it to a category, and reconcile it with your bank statement. That's 10–15 minutes of admin work every single day — for the rest of your life.
          </p>
          <p>
            Nobody sustains that. Life is busy, and money management shouldn't feel like a second job. The moment tracking becomes a chore, the habit dies — and so does the app.
          </p>
          <p>
            The fix is simple: <strong className="text-foreground">automate the tracking.</strong> Modern tools like <Link to="/" className="text-primary hover:underline">Thryve</Link> can connect to your accounts and categorize spending automatically, so you see the full picture without lifting a finger.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Reason 2: Rigid Categories Don't Match Real Life</h2>
          <p>
            Most budgeting apps force you into predefined categories: "Groceries," "Entertainment," "Transportation." But real spending doesn't fit neatly into boxes. Is a coffee with a friend "Groceries," "Entertainment," or "Social"?
          </p>
          <p>
            When the categories don't match how you actually think about money, the data becomes meaningless. You stop trusting the numbers, and once you stop trusting the data, you stop using the app.
          </p>
          <p>
            A better approach is to focus on patterns rather than precise categories. Are you spending more on weekends? Are late-night purchases a problem? Is your subscription creep getting worse? These insights matter more than whether a $4 coffee was "food" or "social."
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Reason 3: They Make You Feel Bad</h2>
          <p>
            Many budgeting apps are built around guilt. They show you red numbers when you overspend. They send notifications saying you've blown your "dining out" budget. They make every purchase feel like a failure.
          </p>
          <p>
            Guilt is a terrible long-term motivator. It works for a few days, maybe a few weeks, and then it backfires. People who feel bad about their spending don't spend less — they stop tracking altogether because looking at the numbers is painful.
          </p>
          <p>
            Good money tools should reduce stress, not add to it. They should help you make better decisions, not shame you for past ones. <strong className="text-foreground">Encouragement beats guilt every time.</strong>
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Reason 4: They Focus on Restriction, Not Habits</h2>
          <p>
            Traditional budgeting is about restriction: "You can only spend $200 on groceries this month." That works until life happens — a friend visits, you host a dinner, groceries cost more — and then the budget is blown and you feel like a failure.
          </p>
          <p>
            The alternative is habit-based money management. Instead of restricting spending, you build small behaviors that naturally improve your finances over time:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Checking your spending once a week (5 minutes, not 30)</li>
            <li>Waiting 24 hours before non-essential purchases</li>
            <li>Automating savings so it happens without willpower</li>
            <li>Reviewing subscriptions every few months</li>
          </ul>
          <p>
            These habits are sustainable because they don't require constant willpower. They work with your life, not against it.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">Reason 5: They're Built for Spreadsheets, Not People</h2>
          <p>
            Let's be honest: many budgeting apps are basically spreadsheets with a nicer interface. They give you grids, categories, formulas, and charts — useful for accountants, overwhelming for everyone else.
          </p>
          <p>
            Most people don't need a financial dashboard. They need to know: Am I spending more than I make? Am I saving enough? Can I afford this purchase? If an app can't answer those questions quickly and clearly, it's too complicated.
          </p>
          <p>
            The best finance tools feel like having a knowledgeable friend who can give you a straight answer — not a spreadsheet that judges you.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">A Better Way: Habit-Based Money Management</h2>
          <p>
            So what works instead of traditional budgeting? A habit-based approach that focuses on small, sustainable actions:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong className="text-foreground">Track automatically.</strong> Connect your accounts or use an app that categorizes spending for you.</li>
            <li><strong className="text-foreground">Set meaningful goals.</strong> Save for something specific — not just "to save money."</li>
            <li><strong className="text-foreground">Automate your savings.</strong> Set it and forget it.</li>
            <li><strong className="text-foreground">Review weekly, not daily.</strong> A quick 5-minute check keeps you aware without burnout.</li>
            <li><strong className="text-foreground">Get guidance, not guilt.</strong> Use tools that help you make better decisions, not ones that shame you.</li>
          </ol>
          <p>
            This is exactly why we built <Link to="/" className="text-primary hover:underline">Thryve</Link> — a personal finance app designed for people who want to manage money without spreadsheets, guilt, or overwhelm. It tracks your spending, helps you set goals, blocks impulse purchases, and gives you honest AI guidance when you need it.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">The Bottom Line</h2>
          <p>
            Budgeting apps fail not because people are bad with money, but because the apps are bad for people. They require too much effort, use rigid categories, rely on guilt, and focus on restriction instead of habits.
          </p>
          <p>
            The better way is simpler: automate what you can, build small habits, set meaningful goals, and use tools that work with your life — not against it. That's how you manage money sustainably, for years instead of weeks.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-xl font-bold font-heading text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">Why do budgeting apps fail for most people?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Budgeting apps fail because they require too much manual effort, use rigid categories that don't match real life, make users feel guilty about spending, and focus on restriction instead of habit-building. Most people abandon them within 2-3 months.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">What's a better alternative to traditional budgeting?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Instead of rigid budgets, use a habit-based approach: track spending automatically, set meaningful savings goals, automate your savings, review weekly, and use tools that provide guidance rather than guilt. Apps like Thryve are built around this approach.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">Can I manage money without a spreadsheet?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Absolutely. Spreadsheets are powerful but require manual maintenance and discipline. Modern finance apps can track spending automatically, categorize transactions, and give you insights without ever opening a spreadsheet.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6 text-center">
          <p className="text-base font-bold text-foreground mb-2">Try a finance app that doesn't fail you</p>
          <p className="text-sm text-muted-foreground mb-4">Thryve is built on habits, not budgets. Free to start, no spreadsheet required.</p>
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