import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Settings as SettingsIcon, 
  Mail, 
  Shield, 
  Zap, 
  Download, 
  Upload,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

const Settings = () => {
  const { user, signOut } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [autoReplySettings, setAutoReplySettings] = useState({
    'Retour': false,
    'Klacht': false,
    'Factuur': true,
    'Vraag': true,
    'Technisch': false,
    'Overig': false
  });

  const [toneDefaults, setToneDefaults] = useState({
    'Retour': 'Empathisch',
    'Klacht': 'Empathisch',
    'Factuur': 'Neutraal',
    'Vraag': 'Vrolijk',
    'Technisch': 'Formeel',
    'Overig': 'Neutraal'
  });

  const [privacySettings, setPrivacySettings] = useState({
    useDataForImprovement: false,
    storeEmailContent: true,
    anonymizeData: true
  });

  const { toast } = useToast();

  // Load settings from database
  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        // Load saved settings if they exist
        // For now we keep the defaults since we haven't added these columns yet
        // This is prepared for future expansion
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          auto_reply_enabled: autoReplySettings['Vraag'], // Save one example
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Instellingen opgeslagen",
        description: "Je voorkeuren zijn succesvol bijgewerkt."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van je instellingen.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleAutoReplyToggle = (category: string, enabled: boolean) => {
    setAutoReplySettings(prev => ({ ...prev, [category]: enabled }));
    toast({
      title: enabled ? "Auto-reply ingeschakeld" : "Auto-reply uitgeschakeld",
      description: `Voor categorie "${category}"`
    });
  };

  const handleToneChange = (category: string, tone: string) => {
    setToneDefaults(prev => ({ ...prev, [category]: tone }));
  };

  const handleExportTemplates = () => {
    // Mock export functionality
    const data = JSON.stringify({ templates: [], exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'support-templates.json';
    a.click();
    
    toast({
      title: "Templates geëxporteerd",
      description: "Templates zijn gedownload als JSON bestand."
    });
  };

  const handleImportTemplates = () => {
    // Mock import functionality
    toast({
      title: "Import functie",
      description: "Template import wordt binnenkort toegevoegd.",
      variant: "destructive"
    });
  };

  const integrations = [
    {
      name: 'Gmail',
      description: 'Koppel je Gmail account voor automatische email synchronisatie',
      icon: Mail,
      status: 'disconnected',
      comingSoon: true
    },
    {
      name: 'Outlook',
      description: 'Integreer met Microsoft Outlook voor enterprise email',
      icon: Mail,
      status: 'disconnected',
      comingSoon: true
    },
    {
      name: 'Zendesk',
      description: 'Synchroniseer tickets en customer data',
      icon: ExternalLink,
      status: 'disconnected',
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Instellingen</h1>
            <p className="text-muted-foreground">
              Configureer je Smart Support Desk
            </p>
          </div>

          {/* Integration settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email Integraties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-4 border rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-secondary rounded-lg">
                      <integration.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={integration.status === 'connected' ? 'default' : 'secondary'}
                    >
                      {integration.status === 'connected' ? 'Verbonden' : 'Niet verbonden'}
                    </Badge>
                    {integration.comingSoon ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Koppelen
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Binnenkort beschikbaar</DialogTitle>
                            <DialogDescription>
                              De {integration.name} integratie komt binnenkort beschikbaar. 
                              We werken hard aan het implementeren van deze functionaliteit.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end">
                            <Button variant="outline">Sluiten</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Button variant="outline" size="sm">
                        Koppelen
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Auto-reply rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Auto-Reply Regels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-medium text-warning-foreground">Belangrijk</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Test auto-reply regels zorgvuldig voordat je ze activeert. 
                      Foutieve automatische antwoorden kunnen klanten verwarren.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Per Categorie</h4>
                {Object.entries(autoReplySettings).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-success' : 'bg-muted'}`} />
                      <span className="font-medium text-foreground">{category}</span>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => handleAutoReplyToggle(category, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tone defaults */}
          <Card>
            <CardHeader>
              <CardTitle>Standaard Toon per Categorie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(toneDefaults).map(([category, tone]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{category}</span>
                  <Select 
                    value={tone} 
                    onValueChange={(value) => handleToneChange(category, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Neutraal">Neutraal</SelectItem>
                      <SelectItem value="Empathisch">Empathisch</SelectItem>
                      <SelectItem value="Formeel">Formeel</SelectItem>
                      <SelectItem value="Vrolijk">Vrolijk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy & AI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacy & AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Data gebruiken voor modelverbetering</p>
                    <p className="text-sm text-muted-foreground">
                      Sta toe dat geanonimiseerde data wordt gebruikt om onze AI modellen te verbeteren
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.useDataForImprovement}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, useDataForImprovement: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Email content tijdelijk opslaan</p>
                    <p className="text-sm text-muted-foreground">
                      Nodig voor AI analyse - data wordt na 30 dagen automatisch verwijderd
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.storeEmailContent}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, storeEmailContent: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Data anonimiseren</p>
                    <p className="text-sm text-muted-foreground">
                      Verwijder persoonlijke informatie voordat data wordt verwerkt
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.anonymizeData}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, anonymizeData: checked }))
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Data Processing Addendum (DPA)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template management */}
          <Card>
            <CardHeader>
              <CardTitle>Template Beheer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handleExportTemplates}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporteer Templates
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleImportTemplates}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importeer Templates
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Templates worden geëxporteerd als JSON bestand dat je kunt delen of als backup gebruiken.
              </p>
            </CardContent>
          </Card>

          {/* System info */}
          <Card>
            <CardHeader>
              <CardTitle>Systeem Informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Versie:</span>
                  <span className="ml-2 font-medium">1.0.0</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2">
                    <Badge variant="default" className="bg-success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Actief
                    </Badge>
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Modus:</span>
                  <span className="ml-2">
                    <Badge variant="secondary">Demo</Badge>
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">AI Model:</span>
                  <span className="ml-2 font-medium">Mock v1.0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={saveSettings} 
                className="w-full"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Instellingen opslaan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Settings;