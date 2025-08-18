import { useState, useEffect } from 'react';
import { MailItem } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { MailList } from '@/components/MailList';
import { MailDetail } from '@/components/MailDetail';
import { dummyMails } from '@/lib/dummy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';

const Inbox = () => {
  const [mails, setMails] = useState<MailItem[]>(dummyMails);
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showOnboarding, setShowOnboarding] = useState(true);

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
    <div className="h-screen flex bg-background">
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
                    🎉 Welkom bij Promptmate Desk
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Je AI-assistent voor klantenservice. Selecteer links een mail om te starten.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button variant="default" size="sm" className="shadow-card">
                    📊 Start demo-data
                  </Button>
                  <Button variant="outline" size="sm" className="shadow-subtle">
                    📧 Mailbox koppelen
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
              <MailDetail
                mail={selectedMail}
                className="h-full"
              />
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
  );
};

export default Inbox;