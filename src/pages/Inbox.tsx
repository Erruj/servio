import { useState, useEffect } from 'react';
import { MailItem, AnalysisResult } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { MailList } from '@/components/MailList';
import { MailDetail } from '@/components/MailDetail';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { ReplyEditor } from '@/components/ReplyEditor';
import { dummyMails } from '@/lib/dummy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const Inbox = () => {
  const [mails, setMails] = useState<MailItem[]>(dummyMails);
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
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

  const handleAnalysisComplete = (newAnalysis: AnalysisResult) => {
    setAnalysis(newAnalysis);
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
          <div className="bg-primary/5 border-b border-primary/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-semibold text-primary">
                    Welkom bij Smart Support Desk
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sneller antwoorden met AI — zonder de controle te verliezen. 
                    Koppel je mailbox of begin met demo-data.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="default" size="sm">
                    Start demo-data
                  </Button>
                  <Button variant="outline" size="sm">
                    Mailbox koppelen
                  </Button>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowOnboarding(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop layout */}
          <div className="hidden lg:flex flex-1">
            {/* Mail list */}
            <div className="w-96">
              <MailList
                mails={mails}
                selectedMailId={selectedMail?.id}
                onSelectMail={handleMailSelect}
                searchQuery={searchQuery}
                filter={filter}
                className="h-full"
              />
            </div>

            {/* Mail detail */}
            <div className="flex-1">
              <MailDetail
                mail={selectedMail}
                className="h-full"
              />
            </div>

            {/* Analysis & Reply panel */}
            <div className="w-80 flex flex-col">
              <div className="flex-1 max-h-1/2">
                <AnalysisPanel
                  mail={selectedMail}
                  onAnalysisComplete={handleAnalysisComplete}
                  className="h-full"
                />
              </div>
              <div className="flex-1">
                <ReplyEditor
                  mail={selectedMail}
                  analysis={analysis}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="lg:hidden flex-1">
            {/* TODO: Implement mobile tabs */}
            <div className="p-6 text-center text-muted-foreground">
              <p>Mobiele versie wordt binnenkort toegevoegd</p>
              <p className="text-sm mt-2">Gebruik een desktop voor de volledige ervaring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;