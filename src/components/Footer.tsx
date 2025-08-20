import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';

import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-card border-t border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {t('demo')}
          </Badge>
          <p className="text-sm text-muted-foreground">
            {t('footerText')}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Secure & Private</span>
        </div>
      </div>
    </footer>
  );
}