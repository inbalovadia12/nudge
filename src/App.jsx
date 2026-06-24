import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
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
import Profile from '@/pages/Profile';
import Challenges from '@/pages/Challenges';
import RegretTracker from '@/pages/RegretTracker';
import FutureFeed from '@/pages/FutureFeed';
import MoneyLeaks from '@/pages/MoneyLeaks';
import ShoppingShield from '@/pages/ShoppingShield';
import FinancialHealth from '@/pages/FinancialHealth';
import NotificationCenter from '@/pages/NotificationCenter';
import FinancialTwin from '@/pages/FinancialTwin';
import ConnectedAccounts from '@/pages/ConnectedAccounts';
import Pricing from '@/pages/Pricing';
import PlaidSandbox from '@/pages/PlaidSandbox';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Splash from '@/components/Splash';
import { ThemeProvider } from 'next-themes';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <Splash />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
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
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/challenges" element={<Challenges />} />
                  <Route path="/insights/regret" element={<RegretTracker />} />
                  <Route path="/insights/future-feed" element={<FutureFeed />} />
                  <Route path="/insights/money-leaks" element={<MoneyLeaks />} />
                  <Route path="/insights/health" element={<FinancialHealth />} />
                  <Route path="/insights/financial-twin" element={<FinancialTwin />} />
                  <Route path="/notifications" element={<NotificationCenter />} />
                  <Route path="/shield" element={<ShoppingShield />} />
                  <Route path="/connected-accounts" element={<ConnectedAccounts />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/plaid-sandbox" element={<PlaidSandbox />} />
                </Route>
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;