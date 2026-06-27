import PublicNav from '@/components/public/PublicNav';
import SiteFooter from '@/components/public/SiteFooter';
import { useSeo } from '@/lib/useSeo';

export default function Terms() {
  useSeo({
    title: 'Terms of Service — Nudigo',
    description: 'The terms and conditions for using Nudigo, a personal finance app. Read about your rights, responsibilities, and our service policies.',
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold font-heading text-foreground mb-2">Terms of Service</h1>
        <p className="text-xs text-muted-foreground mb-8">Last updated: June 26, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-5 text-muted-foreground leading-relaxed">
          <p>By using Nudigo ("the Service"), you agree to these Terms of Service. If you don't agree, please don't use the Service.</p>

          <h2 className="text-lg font-bold text-foreground">1. What Nudigo is</h2>
          <p>Nudigo is a personal finance application that helps users track spending, set savings goals, and receive AI-generated financial guidance. The Service is designed for educational and informational purposes and is not a substitute for professional financial advice.</p>

          <h2 className="text-lg font-bold text-foreground">2. Not financial advice</h2>
          <p>Any guidance, insights, or suggestions provided by Nudigo — whether AI-generated or otherwise — is for informational purposes only. It does not constitute financial, investment, tax, or legal advice. Always consult a qualified professional before making significant financial decisions.</p>

          <h2 className="text-lg font-bold text-foreground">3. Your account</h2>
          <p>You are responsible for maintaining the security of your account and password. You agree to provide accurate information when registering and to keep your account details up to date. You must be at least 13 years old to use the Service.</p>

          <h2 className="text-lg font-bold text-foreground">4. Your data</h2>
          <p>You own your financial data. Nudigo does not sell your personal or financial data to third parties. We use your data solely to provide and improve the Service. See our <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a> for full details.</p>

          <h2 className="text-lg font-bold text-foreground">5. Acceptable use</h2>
          <p>You agree not to: misuse the Service, attempt to access other users' data, use the Service for illegal purposes, or interfere with the Service's operation. We reserve the right to suspend or terminate accounts that violate these terms.</p>

          <h2 className="text-lg font-bold text-foreground">6. Subscriptions and billing</h2>
          <p>Nudigo offers both free and paid plans. Paid subscriptions are billed through Wix Payments. You can cancel your subscription at any time. Refunds are handled according to the billing provider's policies. Free plan features and credit allocations may change over time.</p>

          <h2 className="text-lg font-bold text-foreground">7. Service changes</h2>
          <p>We may update, modify, or discontinue features of the Service at any time. We'll do our best to notify users of significant changes, but we recommend checking back periodically.</p>

          <h2 className="text-lg font-bold text-foreground">8. Limitation of liability</h2>
          <p>Nudigo is provided "as is" without warranties of any kind. We are not liable for any financial losses, decisions made based on the Service, or any indirect or consequential damages arising from your use of the Service.</p>

          <h2 className="text-lg font-bold text-foreground">9. Contact</h2>
          <p>If you have questions about these Terms, please contact us at hello@nudigo.app.</p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}