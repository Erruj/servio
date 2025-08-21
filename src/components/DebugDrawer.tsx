import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bug, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { getAiLogs, type AiLog } from '@/lib/ai';

export function DebugDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const logs = getAiLogs();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const getStatusIcon = (log: AiLog) => {
    if (log.ok) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'analyze': return 'bg-blue-100 text-blue-800';
      case 'generate': return 'bg-green-100 text-green-800';
      case 'regenerate': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 left-4 z-50 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug ({logs.length})
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[500px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Bug className="h-5 w-5 mr-2 text-red-500" />
            AI Debug Logs
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Last {logs.length} AI operations
            </p>
            <Badge variant="outline">
              Dev Mode
            </Badge>
          </div>
          
          <ScrollArea className="h-[calc(100vh-150px)]">
            <div className="space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No AI operations logged yet</p>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log)}
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        {log.mailId && (
                          <span className="text-xs text-muted-foreground">
                            {log.mailId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {log.durationMs ? `${log.durationMs}ms` : '—'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Time:</span> {new Date(log.ts).toLocaleTimeString()}
                      </div>
                      <div>
                        <span className="font-medium">Size:</span> {log.payloadSize} chars
                      </div>
                      {log.lang && (
                        <div>
                          <span className="font-medium">Lang:</span> {log.lang}
                        </div>
                      )}
                      {log.model && (
                        <div>
                          <span className="font-medium">Model:</span> {log.model}
                        </div>
                      )}
                    </div>
                    
                    {!log.ok && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <div className="text-xs font-medium text-red-800">
                          Error: {log.errorCode}
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          {log.errorMessage}
                        </div>
                      </div>
                    )}
                    
                    {index < logs.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}