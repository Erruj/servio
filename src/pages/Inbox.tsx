import { useState, useEffect, lazy, Suspense } from 'react';
import { MailItem } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Topbar } from '@/components/Topbar';
import { MailList } from '@/components/MailList';
import { useTranslation } from 'react-i18next';
import { dummyMails } from '@/lib/dummy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

// Lazy load MailDetail for performance
const MailDetail = lazy(() => import('@/components/MailDetail').then(module => ({ default: module.MailDetail })));

const Inbox = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [mails, setMails] = useState<MailItem[]>([]);
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [demoDataLoaded, setDemoDataLoaded] = useState(false);

  // Load demo data function
  const loadDemoData = () => {
    setMails(dummyMails);
    setDemoDataLoaded(true);
    setShowOnboarding(false);
    toast({
      title: "📧 Demo-data geladen!",
      description: "5 voorbeeldmails zijn toegevoegd aan je inbox.",
    });
  };

  // Auto-load demo data on first visit if no mails
  useEffect(() => {
    if (mails.length === 0 && !demoDataLoaded) {
      // Auto-load demo data after a short delay
      const timer = setTimeout(() => {
        loadDemoData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mails.length, demoDataLoaded]);

  // Mark mail as read when selected
  const handleMailSelect = (mail: MailItem) => {
    setSelectedMail(mail);
    
    // Mark as read
    if (mail.unread) {
      setMails(prev => prev.map(m => 
        m.id === mail.id ? { ...m, unread: false } : m
      ));
    }
  };

  // Auto-select first mail on initial load
  useEffect(() => {
    if (mails.length > 0 && !selectedMail) {
      setSelectedMail(mails[0]);
    }
  }, [mails, selectedMail]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />
      
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Topbar */}
          <Topbar 
            onSearchChange={setSearchQuery}
            onFilterChange={setFilter}
          />

          {/* Onboarding banner */}
          {showOnboarding && (
            <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-primary/20 px-6 py-5 shadow-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/20 rounded-xl">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-primary">
                      🎉 {t('welcome').split(' — ')[0]}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('welcome')}. {t('connectMailbox')} {t('loadDemoData').toLowerCase()}.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="shadow-card"
                      onClick={loadDemoData}
                    >
                      📊 {t('loadDemoData')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="shadow-subtle"
                      onClick={() => window.location.href = '/mailbox-setup'}
                    >
                      📧 {t('connectMailbox')}
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowOnboarding(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

        {/* Content area - Two column layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop layout */}
          <div className="hidden lg:flex flex-1">
            {/* Mail list - Left column */}
            <div className="w-96 min-w-96">
              <MailList
                mails={mails}
                selectedMailId={selectedMail?.id}
                onSelectMail={handleMailSelect}
                searchQuery={searchQuery}
                filter={filter}
                className="h-full"
              />
            </div>

            {/* Mail detail with integrated analysis and reply - Right column */}
            <div className="flex-1">
              <Suspense fallback={
                <div className="h-full bg-card flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('loading')}</p>
                  </div>
                </div>
              }>
                <MailDetail
                  mail={selectedMail}
                  className="h-full"
                />
              </Suspense>
            </div>
          </div>

          {/* Mobile layout placeholder */}
          <div className="lg:hidden flex-1 p-8">
            <div className="text-center text-muted-foreground">
              <div className="p-8 bg-secondary/30 rounded-2xl shadow-card">
                <h2 className="text-xl font-bold mb-2">📱 Mobiele versie</h2>
                <p className="mb-4">De mobiele versie wordt binnenkort toegevoegd</p>
                <p className="text-sm">Gebruik een desktop voor de volledige ervaring</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Inbox;