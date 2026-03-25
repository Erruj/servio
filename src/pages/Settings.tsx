import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from 'next-themes';
import { Loader2, Globe, Bot, Cog, Check, Languages, Sun, Moon, MessageSquare, FolderKanban, Calculator, FileText, Tags } from 'lucide-react';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { setTheme: setAppTheme, theme: currentTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState({
    language: 'nl',
    theme: 'light',
    aiTone: 'neutral',
    autoReply: false,
    autoCategorize: true,
    autoVatCalculation: true,
    monthlySummary: false,
    tagSuggestions: true,
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const loadedSettings = {
          language: data.language || 'nl',
          theme: data.theme || 'light',
          aiTone: data.ai_tone || 'neutral',
          autoReply: data.auto_reply_enabled || false,
          autoCategorize: data.auto_categorize ?? true,
          autoVatCalculation: data.auto_vat_calculation ?? true,
          monthlySummary: data.monthly_summary ?? false,
          tagSuggestions: data.tag_suggestions ?? true,
        };
        setSettings(loadedSettings);

        // Apply loaded settings immediately
        i18n.changeLanguage(loadedSettings.language);
        localStorage.setItem('servio-language', loadedSettings.language);
        setAppTheme(loadedSettings.theme);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleThemeChange = (value: string) => {
    setSettings(prev => ({ ...prev, theme: value }));
    setAppTheme(value); // Apply theme immediately
  };

  const handleLanguageChange = (value: string) => {
    setSettings(prev => ({ ...prev, language: value }));
    i18n.changeLanguage(value); // Apply language immediately
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          language: settings.language,
          theme: settings.theme,
          ai_tone: settings.aiTone,
          auto_reply_enabled: settings.autoReply,
          auto_categorize: settings.autoCategorize,
          auto_vat_calculation: settings.autoVatCalculation,
          monthly_summary: settings.monthlySummary,
          tag_suggestions: settings.tagSuggestions,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Re-apply settings after successful save to ensure consistency
      i18n.changeLanguage(settings.language);
      localStorage.setItem('servio-language', settings.language);
      setAppTheme(settings.theme);

      setSaveSuccess(true);
      toast.success(t('settings') + ' ' + t('success').toLowerCase(), {
        description: settings.language === 'nl' ? 'Je voorkeuren zijn bijgewerkt.' : 'Your preferences have been updated.',
        icon: <Check className="h-4 w-4" />,
      });
      
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Fout bij opslaan', { description: 'Probeer het opnieuw.' });
    } finally {
      setIsSaving(false);
    }
  };

  const SettingItem = ({ 
    icon: Icon, label, description, children 
  }: { icon: React.ElementType; label: string; description: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 p-2 bg-muted rounded-lg">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-0.5 flex-1 min-w-0">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="ml-4 flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={signOut} />
      <div className="flex-1 flex">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 space-y-6 max-w-4xl">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <Cog className="h-7 w-7 text-primary" />
                Instellingen
              </h1>
              <p className="text-muted-foreground">Beheer je voorkeuren, taal en automatiseringen</p>
            </div>

            {/* Language & Theme */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Taal & Weergave</CardTitle>
                </div>
                <CardDescription>Pas de taal en het thema aan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                <SettingItem icon={Languages} label="Taal" description="Selecteer de taal voor de interface">
                  <Select value={settings.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingItem>
                <Separator />
                <SettingItem icon={settings.theme === 'dark' ? Moon : Sun} label="Thema" description="Kies tussen een licht of donker kleurenschema">
                  <Select value={settings.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="h-4 w-4" /> Licht</span></SelectItem>
                      <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="h-4 w-4" /> Donker</span></SelectItem>
                    </SelectContent>
                  </Select>
                </SettingItem>
              </CardContent>
            </Card>

            {/* AI Settings */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">AI Instellingen</CardTitle>
                </div>
                <CardDescription>Configureer de AI-assistent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                <SettingItem icon={MessageSquare} label="Communicatiestijl" description="Bepaal de toon van AI-antwoorden">
                  <Select value={settings.aiTone} onValueChange={(value) => setSettings({ ...settings, aiTone: value })}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutraal</SelectItem>
                      <SelectItem value="empathetic">Empathisch</SelectItem>
                      <SelectItem value="formal">Formeel</SelectItem>
                      <SelectItem value="detailed">Gedetailleerd</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingItem>
                <Separator />
                <SettingItem icon={Bot} label="Automatisch Antwoorden" description="AI antwoordt automatisch op standaard vragen">
                  <Switch checked={settings.autoReply} onCheckedChange={(checked) => setSettings({ ...settings, autoReply: checked })} />
                </SettingItem>
              </CardContent>
            </Card>

            {/* Automations */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Cog className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Automatiseringen</CardTitle>
                </div>
                <CardDescription>Schakel automatische functies in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                <SettingItem icon={FolderKanban} label="Automatisch Categoriseren" description="Sorteer e-mails automatisch in categorieën">
                  <Switch checked={settings.autoCategorize} onCheckedChange={(checked) => setSettings({ ...settings, autoCategorize: checked })} />
                </SettingItem>
                <Separator />
                <SettingItem icon={Calculator} label="BTW Berekening" description="Bereken automatisch BTW bij facturen">
                  <Switch checked={settings.autoVatCalculation} onCheckedChange={(checked) => setSettings({ ...settings, autoVatCalculation: checked })} />
                </SettingItem>
                <Separator />
                <SettingItem icon={FileText} label="Maandelijkse Samenvatting" description="Ontvang een AI-gegenereerd financieel overzicht">
                  <Switch checked={settings.monthlySummary} onCheckedChange={(checked) => setSettings({ ...settings, monthlySummary: checked })} />
                </SettingItem>
                <Separator />
                <SettingItem icon={Tags} label="Tag Suggesties" description="AI-suggesties voor tags bij nieuwe items">
                  <Switch checked={settings.tagSuggestions} onCheckedChange={(checked) => setSettings({ ...settings, tagSuggestions: checked })} />
                </SettingItem>
              </CardContent>
            </Card>

            {/* Save */}
            <div className="sticky bottom-4 pt-2">
              <Button 
                onClick={saveSettings} 
                disabled={isSaving} 
                className={`w-full h-12 text-base font-semibold shadow-elevated transition-all duration-300 ${saveSuccess ? 'bg-success hover:bg-success' : ''}`}
                size="lg"
              >
                {isSaving ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Opslaan...</>
                ) : saveSuccess ? (
                  <><Check className="mr-2 h-5 w-5" />Opgeslagen!</>
                ) : (
                  'Instellingen Opslaan'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
