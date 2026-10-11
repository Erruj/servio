import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface AdminBreadcrumbProps {
  currentPage: string;
  parentLabel?: string;
  parentHref?: string;
}

/** De bovenbalk van de shell toont nu titel en kruimelpad; deze losse breadcrumb rendert niets meer. */
export function AdminBreadcrumb(_props: AdminBreadcrumbProps) {
  return null;
}

export function LegacyAdminBreadcrumb({ currentPage, parentLabel, parentHref = '/dashboard' }: AdminBreadcrumbProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const resolvedParentLabel = parentLabel ?? t('breadcrumbAdministration');

  return (
    <div className="flex items-center gap-3 mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        {t('breadcrumbBack')}
      </Button>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() => navigate(parentHref)}
            >
              {resolvedParentLabel}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentPage}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

