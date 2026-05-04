import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, User, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

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
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filter: string) => void;
  className?: string;
}

export function Topbar({ onSearchChange, onFilterChange, className }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadDisplayName();
    }
  }, [user]);

  const loadDisplayName = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user!.id)
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

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className={`bg-card border-b border-border px-6 py-4 flex items-center justify-between ${className}`}>
      {/* Search and filters */}
      <div className="flex items-center space-x-4 flex-1 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek in subject, afzender of label..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select defaultValue="all" onValueChange={onFilterChange}>
          <SelectTrigger className="w-32">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="inbox">Inbox</SelectItem>
            <SelectItem value="unread">Ongelezen</SelectItem>
            <SelectItem value="starred">Met ster</SelectItem>
            <SelectItem value="important">Belangrijk</SelectItem>
            <SelectItem value="snoozed">Gesnoozed</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
            <SelectItem value="sent">Verzonden</SelectItem>
            <SelectItem value="blocked">Geblokkeerd</SelectItem>
          </SelectContent>
        </Select>

        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground text-xs">
            Wis filters
          </Button>
        )}
      </div>

      {/* Status and user menu */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground"
          title="Sneltoetsen (druk op ?)"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm max-w-[150px] truncate">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/profile')}>Profiel</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>Instellingen</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Uitloggen</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
