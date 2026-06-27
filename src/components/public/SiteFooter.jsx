import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <Logo size="sm" />
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-[200px]">
              A personal finance app built on habits, not spreadsheets.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-foreground mb-3">Guides</h4>
            <ul className="space-y-2">
              <li><Link to="/blog/manage-money-beginners" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Managing Money for Beginners</Link></li>
              <li><Link to="/blog/why-budgeting-apps-fail" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Why Budgeting Apps Fail</Link></li>
              <li><Link to="/blog/simple-money-habits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Money Habits That Stick</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-foreground mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-foreground mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Nudigo. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Built for people who want simpler money management.</p>
        </div>
      </div>
    </footer>
  );
}