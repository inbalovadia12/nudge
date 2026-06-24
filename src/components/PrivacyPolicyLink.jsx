import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyLink({ className = '' }) {
  return (
    <Link
      to="/privacy-policy"
      className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ${className}`}
    >
      <Shield className="w-3.5 h-3.5" />
      Privacy Policy
    </Link>
  );
}