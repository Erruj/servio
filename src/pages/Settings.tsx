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
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { Loader2 } from 'lucide-react';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
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
        setSettings({
          language: data.language || 'nl',
          theme: data.theme || 'light',
          aiTone: data.ai_tone || 'neutral',
          autoReply: data.auto_reply_enabled || false,
          autoCategorize: data.auto_categorize ?? true,
          autoVatCalculation: data.auto_vat_calculation ?? true,
          monthlySummary: data.monthly_summary ?? false,
          tagSuggestions: data.tag_suggestions ?? true,
        });

        i18n.changeLanguage(data.language || 'nl');
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

      i18n.changeLanguage(settings.language);
      toast.success(t('success'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={handleLogout} />

      <div className="flex-1 flex">
        <Sidebar />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t('settings')}</h1>
              <p className="text-muted-foreground">{t('settingsDescription') || 'Configureer je voorkeuren'}</p>
            </div>

            {/* Language & Theme */}
            <Card>
              <CardHeader>
                <CardTitle>{t('languageAndTheme') || 'Taal & Thema'}</CardTitle>
                <CardDescription>{t('languageAndThemeDesc') || 'Pas de interface aan je voorkeur aan'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('language') || 'Taal'}</Label>
                  <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nl">{t('dutch')}</SelectItem>
                      <SelectItem value="en">{t('english')}</SelectItem>
                      <SelectItem value="de">{t('german')}</SelectItem>
                      <SelectItem value="fr">{t('french')}</SelectItem>
                      <SelectItem value="es">{t('spanish')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('theme') || 'Thema'}</Label>
                  <Select value={settings.theme} onValueChange={(value) => setSettings({ ...settings, theme: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('light') || 'Licht'}</SelectItem>
                      <SelectItem value="dark">{t('dark') || 'Donker'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* AI Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t('aiSettings') || 'AI Instellingen'}</CardTitle>
                <CardDescription>{t('aiSettingsDesc') || 'Configureer het AI gedrag'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('aiTone') || 'AI Toon'}</Label>
                  <Select value={settings.aiTone} onValueChange={(value) => setSettings({ ...settings, aiTone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">{t('neutral') || 'Neutraal'}</SelectItem>
                      <SelectItem value="empathetic">{t('empathetic')}</SelectItem>
                      <SelectItem value="formal">{t('formal')}</SelectItem>
                      <SelectItem value="detailed">{t('detailed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('autoReply') || 'Automatisch Antwoorden'}</Label>
                    <p className="text-sm text-muted-foreground">{t('autoReplyDesc') || 'Stuur automatisch antwoorden op basis van AI'}</p>
                  </div>
                  <Switch
                    checked={settings.autoReply}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoReply: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Automations */}
            <Card>
              <CardHeader>
                <CardTitle>{t('automations')}</CardTitle>
                <CardDescription>{t('automationsDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('autoCategorize')}</Label>
                    <p className="text-sm text-muted-foreground">{t('autoCategorizeDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.autoCategorize}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoCategorize: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('autoVatCalculation')}</Label>
                    <p className="text-sm text-muted-foreground">{t('autoVatCalculationDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.autoVatCalculation}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoVatCalculation: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('monthlySummary')}</Label>
                    <p className="text-sm text-muted-foreground">{t('monthlySummaryDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.monthlySummary}
                    onCheckedChange={(checked) => setSettings({ ...settings, monthlySummary: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('tagSuggestions')}</Label>
                    <p className="text-sm text-muted-foreground">{t('tagSuggestionsDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.tagSuggestions}
                    onCheckedChange={(checked) => setSettings({ ...settings, tagSuggestions: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={saveSettings} disabled={isSaving} className="w-full" size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('save') || 'Opslaan'
              )}
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Settings;
