import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: [
      'Account information: your name and email address when you create an account.',
      'Financial data: income, savings goals, spending categories, and transaction data you enter or connect via Plaid (if you choose to link your bank).',
      'Usage data: how you interact with Nudge, including features used, preferences, and coaching settings.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'To provide personalized financial coaching, nudges, and insights based on your spending patterns and goals.',
      'To detect and alert you about spending habits, subscriptions, and bills.',
      'To improve our AI-driven recommendations and the overall Nudge experience.',
      'To send you notifications and reminders you have opted into.',
    ],
  },
  {
    title: '3. Bank Connections (Plaid)',
    body: [
      'If you connect your bank via Plaid, your credentials are handled securely by Plaid — we never see or store your bank login.',
      'We store a Plaid access token to retrieve transaction and balance data on your behalf. You can disconnect at any time, which revokes our access immediately.',
    ],
  },
  {
    title: '4. Data Security',
    body: [
      'All data is encrypted in transit (TLS) and at rest.',
      'Access to your data is restricted to authenticated requests under your account.',
      'We use secure backend infrastructure and never share or sell your personal financial data to third parties or advertisers.',
    ],
  },
  {
    title: '5. Your Rights & Control',
    body: [
      'You can view, edit, or delete your profile and financial data at any time within the app.',
      'You can disconnect bank connections and revoke Plaid access whenever you choose.',
      'You can request full deletion of your account and associated data by contacting us.',
    ],
  },
  {
    title: '6. Data Retention',
    body: [
      'We retain your data for as long as your account is active. Upon account deletion, your personal data is removed within 30 days.',
    ],
  },
  {
    title: '7. Payments',
    body: [
      'Subscription payments are processed securely by Wix Payments. We do not store your credit card information — payment details are handled entirely by the payment processor.',
    ],
  },
  {
    title: '8. Changes to This Policy',
    body: [
      'We may update this privacy policy from time to time. We will notify you of significant changes within the app. Continued use of Nudge after changes constitutes acceptance of the updated policy.',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-24">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 lg:hidden">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">Privacy Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: June 2026</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            At Nudge, your privacy is fundamental. This policy explains what data we collect, how we use it, and the controls you have over it. Your financial data is never sold or shared with advertisers.
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-bold text-foreground mb-2">{section.title}</h2>
              <ul className="space-y-2">
                {section.body.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Questions about your privacy?{' '}
            <a href="mailto:support@nudge.app" className="text-primary font-medium hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}