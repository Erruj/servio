import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, User, HelpCircle, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from '@/components/NotificationBell';
import {MailSearchSuggestions} from '@/components/inbox/MailSearchSuggestions';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TopbarProps {
  searchValue?: string;
  mailView?: string;
  onSavedView?: (query:string,view:string)=>void;
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filter: string) => void;
  className?: string;
  connections?: { id: string; email_address: string; provider: string; is_active?: boolean }[];
  selectedConnectionId?: string | null;
  onConnectionChange?: (id: string | null) => void;
}

export function Topbar({ onSearchChange, onFilterChange, className, connections = [], selectedConnectionId = null, onConnectionChange, searchValue, mailView='inbox', onSavedView }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestionsOpen,setSuggestionsOpen]=useState(false);
  useEffect(()=>{if(searchValue!==undefined)setSearchQuery(searchValue);},[searchValue]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const focus = () => { setMobileSearchOpen(true); requestAnimationFrame(() => searchRef.current?.focus()); };
    window.addEventListener('servio-mail-search', focus);
    return () => window.removeEventListener('servio-mail-search', focus);
  }, []);
  const [displayName, setDisplayName] = useState('');
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadDisplayName();
    }
  }, [user]);

  const loadDisplayName = async () => {
    if(!user)return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      setDisplayName(data?.full_name || data?.email || user?.email || 'Gebruiker');
    } catch {
      setDisplayName(user?.email || 'Gebruiker');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    onSearchChange?.('');
    onFilterChange?.('all');
  };

  const handleLogoutUnused = async () => {
    await signOut();
    navigate('/login');
  };

  // Zonder zoek-handler is dit een lege balk; de shell levert notificaties, help en account.
  if (!onSearchChange) return null;

  return (
    <div className={`bg-background border-b border-border min-h-14 px-2 sm:px-6 flex items-center justify-between gap-2 min-w-0 w-full ${className}`}>
      {/* Search and filters */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-2xl">
        <Button
          variant="ghost" size="icon"
          className={`sm:hidden h-11 w-11 shrink-0 ${mobileSearchOpen ? 'hidden' : ''}`}
          aria-label={t('ui.searchPlaceholder')}
          onClick={() => setMobileSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
        <div className={`relative flex-1 min-w-0 ${mobileSearchOpen ? 'block' : 'hidden sm:block'}`}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder={t('ui.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            autoFocus={mobileSearchOpen}
            onFocus={()=>setSuggestionsOpen(true)}
            onKeyDown={e=>{if(e.key==='Escape'||e.key==='Enter')setSuggestionsOpen(false);}}
            onBlur={() => {setSuggestionsOpen(false); if (!searchQuery) setMobileSearchOpen(false); }}
          />
          {suggestionsOpen&&<MailSearchSuggestions query={searchQuery} view={mailView} onClose={()=>setSuggestionsOpen(false)} onSelect={(query,view)=>{handleSearchChange(query);if(view)onSavedView?.(query,view);searchRef.current?.focus();}}/>}
        </div>
        
        <Select defaultValue="all" onValueChange={onFilterChange}>
          <SelectTrigger className="ml-auto sm:ml-0 w-[4.5rem] sm:w-32 shrink-0 px-2 sm:px-3">
            <Filter className="h-4 w-4 mr-1 sm:mr-2 hidden sm:block" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('ui.filterAll')}</SelectItem>
            <SelectItem value="inbox">Inbox</SelectItem>
            <SelectItem value="unread">{t('ui.unread')}</SelectItem>
            <SelectItem value="starred">{t('ui.starred')}</SelectItem>
            <SelectItem value="important">{t('ui.important')}</SelectItem>
            <SelectItem value="snoozed">{t('ui.snoozed')}</SelectItem>
            <SelectItem value="spam">{t('ui.spam')}</SelectItem>
            <SelectItem value="sent">{t('ui.sent')}</SelectItem>
            <SelectItem value="blocked">{t('ui.blocked')}</SelectItem>
          </SelectContent>
        </Select>
        {connections.filter(c => c.is_active !== false).length >= 2 && (
          <Select
            value={selectedConnectionId ?? 'all'}
            onValueChange={(v) => onConnectionChange?.(v === 'all' ? null : v)}
          >
            <SelectTrigger className="hidden sm:flex w-44">
              <Mail className="h-4 w-4 mr-2 shrink-0" />
              <SelectValue placeholder={t('ui.allMailboxes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('ui.allMailboxes')}</SelectItem>
              {connections.filter(c => c.is_active !== false).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate max-w-[160px]">{c.email_address}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}


        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground text-xs">
            {t('ui.clearFilters')}
          </Button>
        )}
      </div>

    </div>
  );
}
