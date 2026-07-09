import { useNavigate } from 'react-router-dom';
import UnderConstruction from '@/components/UnderConstruction';
import { ArrowLeft, Bug } from 'lucide-react';

export default function PlaidSandbox() {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <button onClick={() => navigate('/profile')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Profile
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Bug className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold font-heading">Plaid Sandbox</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Development & debugging panel for Plaid integration</p>

      <UnderConstruction
        title="Under Construction"
        message="The Plaid integration is being upgraded. This developer panel will be back soon."
      />
    </div>
  );
}