import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useLanguagePersistence } from "@/hooks/useLanguagePersistence";
import { CookieConsent } from "@/components/CookieConsent";
import "@/lib/i18n";
import Inbox from "./pages/Inbox";
import Dashboard from "./pages/Dashboard";
import Statistics from "./pages/Statistics";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import Signup from "./pages/Signup";
import MailboxSetup from "./pages/MailboxSetup";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import { DebugDrawer } from "./components/DebugDrawer";
import FinancialOverview from "./pages/administration/FinancialOverview";
import AIAssistant from "./pages/administration/AIAssistant";
import Invoices from "./pages/administration/Invoices";
import Receipts from "./pages/administration/Receipts";
import Documents from "./pages/administration/Documents";
import Exports from "./pages/administration/Exports";
import AuditLog from "./pages/administration/AuditLog";
import TeamManagement from "./pages/administration/TeamManagement";
import Customers from "./pages/administration/Customers";
import Quotes from "./pages/administration/Quotes";
import TimeTracking from "./pages/administration/TimeTracking";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SubscriptionGate } from "./components/SubscriptionGate";

// Marketing website pages
import MarketingHome from "./pages/marketing/Home";
import MarketingFeatures from "./pages/marketing/Features";
import MarketingPricing from "./pages/marketing/Pricing";
import MarketingAbout from "./pages/marketing/About";

// Legal pages
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import Terms from "./pages/legal/Terms";
import Cookies from "./pages/legal/Cookies";
import Contact from "./pages/legal/Contact";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppRoutes() {
  const { user, isLoading } = useAuth();
  useLanguagePersistence();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Marketing website - public, no auth */}
      <Route path="/" element={<MarketingHome />} />
      <Route path="/features" element={<MarketingFeatures />} />
      <Route path="/pricing" element={<MarketingPricing />} />
      <Route path="/about" element={<MarketingAbout />} />
      
      {/* Legal pages - public */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/contact" element={<Contact />} />
      
      {/* Auth pages */}
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected app routes */}
      <Route path="/app" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'agent']}>
          <Inbox />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/stats" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance', 'viewer']}>
          <Statistics />
        </ProtectedRoute>
      } />
      <Route path="/templates" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'agent']}>
          <Templates />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute requiredRoles={['owner', 'admin']}>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/mailbox-setup" element={
        <ProtectedRoute>
          <MailboxSetup />
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance', 'viewer']}>
          <Analytics />
        </ProtectedRoute>
      } />
      <Route path="/team" element={
        <ProtectedRoute requiredRoles={['owner', 'admin']}>
          <TeamManagement />
        </ProtectedRoute>
      } />
      
      {/* Administration Routes */}
      <Route path="/administration/overview" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <SubscriptionGate feature="Financieel Overzicht">
            <FinancialOverview />
          </SubscriptionGate>
        </ProtectedRoute>
      } />
      <Route path="/administration/ai-assistant" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <SubscriptionGate feature="AI Boekhoudassistent">
            <AIAssistant />
          </SubscriptionGate>
        </ProtectedRoute>
      } />
      <Route path="/administration/invoices" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <SubscriptionGate feature="Facturen">
            <Invoices />
          </SubscriptionGate>
        </ProtectedRoute>
      } />
      <Route path="/administration/receipts" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <SubscriptionGate feature="Bonnetjes">
            <Receipts />
          </SubscriptionGate>
        </ProtectedRoute>
      } />
      <Route path="/administration/documents" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <SubscriptionGate feature="Documenten">
            <Documents />
          </SubscriptionGate>
        </ProtectedRoute>
      } />
      <Route path="/administration/exports" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <SubscriptionGate feature="Exports">
            <Exports />
          </SubscriptionGate>
        </ProtectedRoute>
      } />
      <Route path="/administration/audit-log" element={
        <ProtectedRoute requiredRoles={['owner', 'admin']}>
          <AuditLog />
        </ProtectedRoute>
      } />
      
      {/* Catch-all for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <ErrorBoundary>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
                <DebugDrawer />
                <CookieConsent />
              </BrowserRouter>
            </ErrorBoundary>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
