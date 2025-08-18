import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production, log to monitoring service
    if (process.env.NODE_ENV === 'production') {
      console.error('ErrorBoundary caught an error:', error.name);
    } else {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} />;
      }

      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Er is een fout opgetreden</AlertTitle>
            <AlertDescription>
              {process.env.NODE_ENV === 'production' 
                ? 'Er is een onverwachte fout opgetreden. Probeer de pagina te verversen.'
                : this.state.error?.message
              }
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="p-4">
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Applicatie Fout</AlertTitle>
      <AlertDescription>
        {process.env.NODE_ENV === 'production' 
          ? 'Er is een fout opgetreden bij het laden van deze sectie.'
          : error.message
        }
      </AlertDescription>
    </Alert>
  </div>
);