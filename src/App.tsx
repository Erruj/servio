import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { SubscriptionProvider } from "@/components/SubscriptionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useLanguagePersistence } from "@/hooks/useLanguagePersistence";
import { useUrlLanguageSync } from "@/hooks/useUrlLanguageSync";
import { CookieConsent } from "@/components/CookieConsent";
import "@/lib/i18n";
import { DebugDrawer } from "./components/DebugDrawer";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SubscriptionGate } from "./components/SubscriptionGate";
import { PageTransition } from "./components/PageTransition";
import { AppShell } from "./components/AppShell";

// Lazy-loaded pages
const Inbox = lazy(() => import("./pages/Inbox"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Statistics = lazy(() => import("./pages/Statistics"));
const Templates = lazy(() => import("./pages/Templates"));
const Settings = lazy(() => import("./pages/Settings"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Signup = lazy(() => import("./pages/Signup"));
const MailboxSetup = lazy(() => import("./pages/MailboxSetup"));
const Analytics = lazy(() => import("./pages/Analytics"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));

// Administration
const FinancialOverview = lazy(() => import("./pages/administration/FinancialOverview"));
const AIAssistant = lazy(() => import("./pages/administration/AIAssistant"));
const Invoices = lazy(() => import("./pages/administration/Invoices"));
const Receipts = lazy(() => import("./pages/administration/Receipts"));
const Documents = lazy(() => import("./pages/administration/Documents"));
const Exports = lazy(() => import("./pages/administration/Exports"));
const AuditLog = lazy(() => import("./pages/administration/AuditLog"));
const TeamManagement = lazy(() => import("./pages/administration/TeamManagement"));
const Customers = lazy(() => import("./pages/administration/Customers"));
const Quotes = lazy(() => import("./pages/administration/Quotes"));
const TimeTracking = lazy(() => import("./pages/administration/TimeTracking"));

// Marketing
const MarketingHome = lazy(() => import("./pages/marketing/Home"));
const MarketingFeatures = lazy(() => import("./pages/marketing/Features"));
const MarketingPricing = lazy(() => import("./pages/marketing/Pricing"));
const MarketingAbout = lazy(() => import("./pages/marketing/About"));
const Blog = lazy(() => import("./pages/marketing/Blog"));
const BlogPost = lazy(() => import("./pages/marketing/BlogPost"));

// Legal
import { MarketingTheme } from "./components/marketing/MarketingTheme";

const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Cookies = lazy(() => import("./pages/legal/Cookies"));
const Contact = lazy(() => import("./pages/legal/Contact"));

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Laden...</p>
    </div>
  </div>
);

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
  useUrlLanguageSync();

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
    <PageTransition>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Marketing website - public, no auth (NL default) */}
      <Route path="/" element={<MarketingTheme><MarketingHome /></MarketingTheme>} />
      <Route path="/features" element={<MarketingTheme><MarketingFeatures /></MarketingTheme>} />
      <Route path="/pricing" element={<MarketingTheme><MarketingPricing /></MarketingTheme>} />
      <Route path="/about" element={<MarketingTheme><MarketingAbout /></MarketingTheme>} />
      <Route path="/blog" element={<MarketingTheme><Blog /></MarketingTheme>} />
      <Route path="/blog/:slug" element={<MarketingTheme><BlogPost /></MarketingTheme>} />

      {/* Marketing website - English (/en/*) */}
      <Route path="/en" element={<MarketingTheme><MarketingHome /></MarketingTheme>} />
      <Route path="/en/features" element={<MarketingTheme><MarketingFeatures /></MarketingTheme>} />
      <Route path="/en/pricing" element={<MarketingTheme><MarketingPricing /></MarketingTheme>} />
      <Route path="/en/about" element={<MarketingTheme><MarketingAbout /></MarketingTheme>} />
      <Route path="/en/blog" element={<MarketingTheme><Blog /></MarketingTheme>} />
      <Route path="/en/blog/:slug" element={<MarketingTheme><BlogPost /></MarketingTheme>} />
      <Route path="/en/contact" element={<MarketingTheme><Contact /></MarketingTheme>} />
      <Route path="/en/privacy" element={<MarketingTheme><PrivacyPolicy /></MarketingTheme>} />
      <Route path="/en/terms" element={<MarketingTheme><Terms /></MarketingTheme>} />
      <Route path="/en/cookies" element={<MarketingTheme><Cookies /></MarketingTheme>} />

      {/* Legal pages - public */}
      <Route path="/privacy" element={<MarketingTheme><PrivacyPolicy /></MarketingTheme>} />
      <Route path="/terms" element={<MarketingTheme><Terms /></MarketingTheme>} />
      <Route path="/cookies" element={<MarketingTheme><Cookies /></MarketingTheme>} />
      <Route path="/contact" element={<MarketingTheme><Contact /></MarketingTheme>} />
      
      {/* Auth pages */}
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* OAuth consent for MCP clients */}
      <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      
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
          <AppShell>
            <SubscriptionGate feature="Financieel Overzicht">
              <FinancialOverview />
            </SubscriptionGate>
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/administration/ai-assistant" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <AppShell>
            <SubscriptionGate feature="AI Boekhoudassistent">
              <AIAssistant />
            </SubscriptionGate>
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/administration/invoices" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <AppShell>
            <SubscriptionGate feature="Facturen">
              <Invoices />
            </SubscriptionGate>
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/administration/receipts" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <AppShell>
            <SubscriptionGate feature="Bonnetjes">
              <Receipts />
            </SubscriptionGate>
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/administration/documents" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <AppShell>
            <SubscriptionGate feature="Documenten">
              <Documents />
            </SubscriptionGate>
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/administration/exports" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <AppShell>
            <SubscriptionGate feature="Exports">
              <Exports />
            </SubscriptionGate>
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/administration/audit-log" element={
        <ProtectedRoute requiredRoles={['owner', 'admin']}>
          <AppShell>
            <AuditLog />
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/administration/customers" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <AppShell>
            <SubscriptionGate feature="Klanten">
              <Customers />
            </SubscriptionGate>
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/administration/quotes" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <AppShell>
            <SubscriptionGate feature="Offertes">
              <Quotes />
            </SubscriptionGate>
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/administration/time-tracking" element={
        <ProtectedRoute requiredRoles={['owner', 'admin', 'finance']}>
          <AppShell>
            <SubscriptionGate feature="Urenregistratie">
              <TimeTracking />
            </SubscriptionGate>
          </AppShell>
        </ProtectedRoute>
      } />
      
      
      {/* Catch-all for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
    </PageTransition>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <ErrorBoundary>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRoutes />
                  <MobileBottomNav />
                  <DebugDrawer />
                  <CookieConsent />
                </BrowserRouter>
              </ErrorBoundary>
            </SubscriptionProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
