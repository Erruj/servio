import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, LogOut, User } from 'lucide-react';

interface HeaderProps {
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border shadow-subtle">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Servio</h1>
              <p className="text-sm text-muted-foreground">
                AI-klantenservice die tot 80% van je mails automatisch afhandelt
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            Demo
          </Badge>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Uitloggen
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}