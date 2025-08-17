import { useState, useEffect } from 'react';
import { MailItem, AnalysisResult, Category, Urgency, Sentiment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, RefreshCw, Brain } from 'lucide-react';
import { analyzeEmail } from '@/lib/ai';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCategoryColor, getUrgencyColor, getSentimentColor } from '@/lib/dummy';

interface AnalysisPanelProps {
  mail: MailItem | null;
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
  className?: string;
}

export function AnalysisPanel({ mail, onAnalysisComplete, className }: AnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-analyze when mail changes
  useEffect(() => {
    if (mail) {
      analyzeCurrentMail();
    } else {
      setAnalysis(null);
    }
  }, [mail]);

  const analyzeCurrentMail = async () => {
    if (!mail) return;

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeEmail(mail);
      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      setError('Analyse mislukt. Probeer opnieuw.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCategoryChange = (newCategory: Category) => {
    if (analysis) {
      const updatedAnalysis = { ...analysis, category: newCategory };
      setAnalysis(updatedAnalysis);
      onAnalysisComplete?.(updatedAnalysis);
    }
  };

  const handleUrgencyChange = (newUrgency: Urgency) => {
    if (analysis) {
      const updatedAnalysis = { ...analysis, urgency: newUrgency };
      setAnalysis(updatedAnalysis);
      onAnalysisComplete?.(updatedAnalysis);
    }
  };

  if (!mail) {
    return (
      <div className={`bg-card border-l border-border ${className}`}>
        <div className="p-6 text-center text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selecteer een email voor AI-analyse</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border-l border-border overflow-y-auto ${className}`}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            AI Analyse
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeCurrentMail}
            disabled={isAnalyzing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyseren...' : 'Vernieuw'}
          </Button>
        </div>

        {/* Loading state */}
        {isAnalyzing && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center text-destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis results */}
        {analysis && !isAnalyzing && (
          <>
            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Samenvatting</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-foreground">{analysis.summary}</p>
              </CardContent>
            </Card>

            {/* Key points */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Kernpunten</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {analysis.bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-success mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Classification */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Classificatie</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Categorie</label>
                  <Select 
                    value={analysis.category} 
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retour">Retour</SelectItem>
                      <SelectItem value="Klacht">Klacht</SelectItem>
                      <SelectItem value="Factuur">Factuur</SelectItem>
                      <SelectItem value="Vraag">Vraag</SelectItem>
                      <SelectItem value="Technisch">Technisch</SelectItem>
                      <SelectItem value="Overig">Overig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Urgency */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Urgentie</label>
                  <Select 
                    value={analysis.urgency} 
                    onValueChange={handleUrgencyChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hoog">Hoog</SelectItem>
                      <SelectItem value="Normaal">Normaal</SelectItem>
                      <SelectItem value="Laag">Laag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sentiment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Sentiment</label>
                  <Badge className={getSentimentColor(analysis.sentiment)}>
                    {analysis.sentiment}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Policy flags */}
            {analysis.policyFlags && analysis.policyFlags.length > 0 && (
              <Card className="border-warning">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center text-warning">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Beleid Waarschuwingen
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {analysis.policyFlags.map((flag, index) => (
                      <div key={index} className="bg-warning/10 p-3 rounded-lg">
                        <p className="text-sm font-medium text-warning-foreground">
                          {flag.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggested template */}
            {analysis.suggestedTemplateId && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Aanbevolen Template</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Badge variant="outline" className="text-primary">
                    Template #{analysis.suggestedTemplateId.slice(-3)}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}