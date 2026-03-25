import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';

import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-card border-t border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Servio</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Secure & Private</span>
        </div>
      </div>
    </footer>
  );
}