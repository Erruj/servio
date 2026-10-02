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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from 'next-themes';
import { usePersonalization } from '@/hooks/usePersonalization';
import { Loader2, Globe, Bot, Cog, Check, Languages, Sun, Moon, MessageSquare, FolderKanban, Calculator, FileText, Tags, Palette, LayoutGrid, Pen, Sparkles, Zap, Download } from 'lucide-react';

const ACCENT_OPTIONS = [
  { value: 'blue', labelKey: 'colorBlue', class: 'bg-[hsl(217,91%,60%)]' },
  { value: 'purple', labelKey: 'colorPurple', class: 'bg-[hsl(262,83%,58%)]' },
  { value: 'green', labelKey: 'colorGreen', class: 'bg-[hsl(160,84%,39%)]' },
  { value: 'orange', labelKey: 'colorOrange', class: 'bg-[hsl(25,95%,53%)]' },
  { value: 'pink', labelKey: 'colorPink', class: 'bg-[hsl(330,81%,60%)]' },
  { value: 'teal', labelKey: 'colorTeal', class: 'bg-[hsl(174,72%,46%)]' },
  { value: 'red', labelKey: 'colorRed', class: 'bg-[hsl(0,72%,51%)]' },
  { value: 'indigo', labelKey: 'colorIndigo', class: 'bg-[hsl(239,84%,67%)]' },
];

const AI_PERSONALITIES = [
  { value: 'neutral', icon: '💼', labelKey: 'aiStyleBusiness', descKey: 'aiStyleBusinessDesc' },
  { value: 'friendly', icon: '😊', labelKey: 'aiStyleFriendly', descKey: 'aiStyleFriendlyDesc' },
  { value: 'direct', icon: '⚡', labelKey: 'aiStyleDirect', descKey: 'aiStyleDirectDesc' },
  { value: 'enthusiastic', icon: '🚀', labelKey: 'aiStyleEnthusiastic', descKey: 'aiStyleEnthusiasticDesc' },
  { value: 'custom', icon: '✏️', labelKey: 'aiStyleCustom', descKey: 'aiStyleCustomDesc' },
];

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { setTheme: setAppTheme, theme: currentTheme } = useTheme();
  const { settings: personalization, updateSettings: updatePersonalization } = usePersonalization();
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
    autoExportEnabled: false,
    autoProcessAttachments: false,
    tagSuggestions: true,
  });

  // Personalization local state
  const [aiPersonality, setAiPersonality] = useState(personalization.aiPersonality);
  const [aiCustomPersonality, setAiCustomPersonality] = useState(personalization.aiCustomPersonality);
  const [emailSignature, setEmailSignature] = useState(personalization.emailSignature);
  const [accentColor, setAccentColor] = useState(personalization.accentColor);
  const [compactLayout, setCompactLayout] = useState(personalization.compactLayout);

  useEffect(() => {
    setAiPersonality(personalization.aiPersonality);
    setAiCustomPersonality(personalization.aiCustomPersonality);
    setEmailSignature(personalization.emailSignature);
    setAccentColor(personalization.accentColor);
    setCompactLayout(personalization.compactLayout);
  }, [personalization]);

  const [hasGmailConnection, setHasGmailConnection] = useState<boolean | null>(null);

  useEffect(() => { loadSettings(); loadEmailConnections(); }, [user]);

  const loadEmailConnections = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('email_connections')
        .select('provider')
        .eq('user_id', user.id);
      const providers = (data ?? []).map((c: any) => (c.provider || '').toLowerCase());
      setHasGmailConnection(providers.some((p) => p.includes('gmail') || p.includes('google')));
    } catch (error) { console.error('Error loading email connections:', error); }
  };

  const loadSettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_settings')
        // Never select('*') here: clients have no SELECT privilege on the
        // stripe_* / subscription_product_id columns (403).
        .select('language, theme, ai_tone, auto_reply_enabled, auto_categorize, auto_vat_calculation, monthly_summary, auto_export_enabled, auto_process_invoice_attachments, tag_suggestions')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const loaded = {
          language: data.language || 'nl',
          theme: data.theme || 'light',
          aiTone: data.ai_tone || 'neutral',
          autoReply: data.auto_reply_enabled || false,
          autoCategorize: data.auto_categorize ?? true,
          autoVatCalculation: data.auto_vat_calculation ?? true,
          monthlySummary: data.monthly_summary ?? false,
          autoExportEnabled: (data as any).auto_export_enabled ?? false,
          autoProcessAttachments: (data as any).auto_process_invoice_attachments ?? false,
          tagSuggestions: data.tag_suggestions ?? true,
        };
        // Taalkeuze in de browser (taalkiezer) heeft voorrang op het profiel
        const localLang = localStorage.getItem('servio-language');
        if (localLang) {
          loaded.language = localLang;
        } else {
          i18n.changeLanguage(loaded.language);
          localStorage.setItem('servio-language', loaded.language);
        }
        setSettings(loaded);
        setAppTheme(loaded.theme);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error(t('settingsLoadFailed'), {
        description: error?.message || t('settingsLoadFailedDesc'),
      });
    }
  };

  const handleThemeChange = (value: string) => {
    setSettings(prev => ({ ...prev, theme: value }));
    setAppTheme(value);
  };

  const handleLanguageChange = (value: string) => {
    setSettings(prev => ({ ...prev, language: value }));
    i18n.changeLanguage(value);
    localStorage.setItem('servio-language', value);
  };

  const handleAccentChange = (color: string) => {
    setAccentColor(color);
    updatePersonalization({ accentColor: color });
  };

  const handleCompactToggle = (checked: boolean) => {
    setCompactLayout(checked);
    updatePersonalization({ compactLayout: checked });
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
          auto_export_enabled: settings.autoExportEnabled,
          auto_process_invoice_attachments: settings.autoProcessAttachments,
          tag_suggestions: settings.tagSuggestions,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (error) throw error;

      // Save personalization
      await updatePersonalization({
        aiPersonality,
        aiCustomPersonality,
        emailSignature,
        accentColor,
        compactLayout,
      });

      i18n.changeLanguage(settings.language);
      localStorage.setItem('servio-language', settings.language);
      setAppTheme(settings.theme);

      setSaveSuccess(true);
      toast.success(t('settingsSaved'), {
        description: t('preferencesUpdated'),
        icon: <Check className="h-4 w-4" />,
      });
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('saveError'), { description: t('tryAgainPrompt') });
    } finally {
      setIsSaving(false);
    }
  };

  const SettingItem = ({ icon: Icon, label, description, children }: { icon: React.ElementType; label: string; description: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 p-2 bg-muted rounded-lg"><Icon className="h-4 w-4 text-muted-foreground" /></div>
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
                <Cog className="h-7 w-7 text-primary" /> {t('settingsTitle')}
              </h1>
              <p className="text-muted-foreground">{t('settingsSubtitle')}</p>
            </div>

            {/* UI Personalization */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{t('appearance')}</CardTitle>
                </div>
                <CardDescription>{t('appearanceDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('accentColor')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleAccentChange(opt.value)}
                        className={`w-8 h-8 rounded-full transition-all duration-200 ${opt.class} ${accentColor === opt.value ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                        title={t(opt.labelKey)}
                        aria-label={t(opt.labelKey)}
                      />
                    ))}
                  </div>
                </div>
                <Separator />
                <SettingItem icon={LayoutGrid} label={t('compactLayout')} description={t('compactLayoutDesc')}>
                  <Switch checked={compactLayout} onCheckedChange={handleCompactToggle} />
                </SettingItem>
              </CardContent>
            </Card>

            {/* Language & Theme */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /><CardTitle className="text-lg">{t('languageAndDisplay')}</CardTitle></div>
                <CardDescription>{t('languageAndDisplayDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                <SettingItem icon={Languages} label={t('language')} description={t('selectLanguage')}>
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
                <SettingItem icon={settings.theme === 'dark' ? Moon : Sun} label={t('theme')} description={t('themeDesc')}>
                  <Select value={settings.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="h-4 w-4" /> {t('light')}</span></SelectItem>
                      <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="h-4 w-4" /> {t('dark')}</span></SelectItem>
                    </SelectContent>
                  </Select>
                </SettingItem>
              </CardContent>
            </Card>

            {/* AI Personality */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><CardTitle className="text-lg">{t('aiPersonality')}</CardTitle></div>
                <CardDescription>{t('aiPersonalityDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t('communicationStyle')}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AI_PERSONALITIES.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setAiPersonality(p.value)}
                        className={`text-left p-3 rounded-xl border transition-all duration-200 ${aiPersonality === p.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'}`}
                      >
                        <div className="font-medium text-sm">{p.icon} {t(p.labelKey)}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t(p.descKey)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {aiPersonality === 'custom' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('describeStyle')}</Label>
                    <Textarea
                      value={aiCustomPersonality}
                      onChange={(e) => setAiCustomPersonality(e.target.value)}
                      placeholder={t('customStylePlaceholder')}
                      className="min-h-20 resize-none"
                    />
                  </div>
                )}

                <Separator />

                <SettingItem icon={Bot} label={t('autoReply')} description={t('autoReplyDesc')}>
                  <Switch checked={settings.autoReply} onCheckedChange={(checked) => setSettings({ ...settings, autoReply: checked })} />
                </SettingItem>
              </CardContent>
            </Card>

            {/* Email Signature */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Pen className="h-5 w-5 text-primary" /><CardTitle className="text-lg">{t('emailSignature')}</CardTitle></div>
                <CardDescription>{t('emailSignatureDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={emailSignature}
                  onChange={(e) => setEmailSignature(e.target.value)}
                  placeholder={t('emailSignaturePlaceholder')}
                  className="min-h-28 resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">{t('emailSignatureTip')}</p>
              </CardContent>
            </Card>

            {/* Quick Actions Customization */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /><CardTitle className="text-lg">{t('quickActionsTitle')}</CardTitle></div>
                <CardDescription>{t('quickActionsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <QuickActionsEditor
                  actions={personalization.quickActions}
                  onSave={(actions) => updatePersonalization({ quickActions: actions })}
                />
              </CardContent>
            </Card>

            {/* Automations */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Cog className="h-5 w-5 text-primary" /><CardTitle className="text-lg">{t('automationsTitle')}</CardTitle></div>
                <CardDescription>{t('automationsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                <SettingItem icon={FolderKanban} label={t('autoCategorize')} description={t('autoCategorizeDesc')}>
                  <Switch checked={settings.autoCategorize} onCheckedChange={(checked) => setSettings({ ...settings, autoCategorize: checked })} />
                </SettingItem>
                <Separator />
                <SettingItem icon={Calculator} label={t('vatCalculation')} description={t('vatCalculationDesc')}>
                  <Switch checked={settings.autoVatCalculation} onCheckedChange={(checked) => setSettings({ ...settings, autoVatCalculation: checked })} />
                </SettingItem>
                <Separator />
                <SettingItem icon={FileText} label={t('monthlySummary')} description={t('monthlySummaryDesc')}>
                  <Switch checked={settings.monthlySummary} onCheckedChange={(checked) => setSettings({ ...settings, monthlySummary: checked })} />
                </SettingItem>
                <Separator />
                <SettingItem icon={Sparkles} label={t('autoProcessAttachments')} description={t('autoProcessAttachmentsDesc')}>
                  <Switch
                    checked={settings.autoProcessAttachments}
                    onCheckedChange={(checked) => {
                      if (checked && hasGmailConnection === false) {
                        toast.warning(t('noGmailConnected'), {
                          description: t('noGmailConnectedDesc'),
                        });
                      }
                      setSettings({ ...settings, autoProcessAttachments: checked });
                    }}
                  />
                </SettingItem>
                <Separator />
                <SettingItem icon={Download} label={t('automaticMonthlyExport')} description={t('automaticMonthlyExportDesc')}>
                  <Switch checked={settings.autoExportEnabled} onCheckedChange={(checked) => setSettings({ ...settings, autoExportEnabled: checked })} />
                </SettingItem>
                <Separator />
                <SettingItem icon={Tags} label={t('tagSuggestions')} description={t('tagSuggestionsDesc')}>
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
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t('saving')}</>
                ) : saveSuccess ? (
                  <><Check className="mr-2 h-5 w-5" />{t('saved')}</>
                ) : (
                  t('saveSettings')
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

// Quick Actions Editor sub-component
function QuickActionsEditor({ actions, onSave }: { actions: any[] | null; onSave: (a: any[]) => void }) {
  const { t } = useTranslation();
  const defaultQuickActions = [
    { label: t('inbox'), href: '/app', icon: 'Mail' },
    { label: t('newInvoice'), href: '/administration/invoices', icon: 'Receipt' },
    { label: t('aiReply'), href: '/app', icon: 'Sparkles' },
  ];
  const [items, setItems] = useState(actions || defaultQuickActions);
  const [editing, setEditing] = useState(false);

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItem = () => {
    if (items.length >= 6) return;
    setItems([...items, { label: '', href: '/', icon: 'Zap' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const save = () => {
    onSave(items.filter(i => i.label.trim()));
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <div key={i} className="px-3 py-2 bg-muted rounded-lg text-sm font-medium">{item.label || t('unnamed')}</div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>{t('ui.customize')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input value={item.label} onChange={(e) => updateItem(i, 'label', e.target.value)} placeholder="Label" className="flex-1" />
          <Select value={item.href} onValueChange={(v) => updateItem(i, 'href', v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="/app">Inbox</SelectItem>
              <SelectItem value="/dashboard">Dashboard</SelectItem>
              <SelectItem value="/administration/invoices">{t('invoices')}</SelectItem>
              <SelectItem value="/administration/quotes">{t('quotes')}</SelectItem>
              <SelectItem value="/administration/customers">{t('customers')}</SelectItem>
              <SelectItem value="/administration/receipts">{t('receipts')}</SelectItem>
              <SelectItem value="/administration/time-tracking">{t('hours')}</SelectItem>
              <SelectItem value="/templates">Templates</SelectItem>
              <SelectItem value="/stats">{t('statistics')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="text-destructive">×</Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addItem} disabled={items.length >= 6}>+ {t('add')}</Button>
        <Button size="sm" onClick={save}>{t('save')}</Button>
        <Button variant="ghost" size="sm" onClick={() => { setItems(actions || defaultQuickActions); setEditing(false); }}>{t('cancel')}</Button>
      </div>
    </div>
  );
}

export default Settings;
