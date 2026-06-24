import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Check from '@/pages/Check';
import Goals from '@/pages/Goals';
import Assistant from '@/pages/Assistant';
import Insights from '@/pages/Insights';
import Subscriptions from '@/pages/Subscriptions';
import PaycheckFlow from '@/pages/PaycheckFlow';
import Heatmap from '@/pages/Heatmap';
import Simulator from '@/pages/Simulator';
import Personality from '@/pages/Personality';
import Deals from '@/pages/Deals';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/check" element={<Check />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/insights/subscriptions" element={<Subscriptions />} />
        <Route path="/insights/paycheck" element={<PaycheckFlow />} />
        <Route path="/insights/heatmap" element={<Heatmap />} />
        <Route path="/insights/simulator" element={<Simulator />} />
        <Route path="/insights/personality" element={<Personality />} />
        <Route path="/insights/deals" element={<Deals />} />
        <Route path="/assistant" element={<Assistant />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App