import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export interface PersonalizationSettings {
  aiPersonality: string;
  aiCustomPersonality: string;
  emailSignature: string;
  accentColor: string;
  compactLayout: boolean;
  sidebarOrder: string[] | null;
  sidebarFavorites: string[];
  dashboardWidgets: Record<string, { visible: boolean; order: number }> | null;
  quickActions: { label: string; href: string; icon: string }[] | null;
}

const DEFAULT_SETTINGS: PersonalizationSettings = {
  aiPersonality: 'neutral',
  aiCustomPersonality: '',
  emailSignature: '',
  accentColor: 'blue',
  compactLayout: false,
  sidebarOrder: null,
  sidebarFavorites: [],
  dashboardWidgets: null,
  quickActions: null,
};

const ACCENT_COLORS: Record<string, string> = {
  blue: '217 91% 60%',
  purple: '262 83% 58%',
  green: '160 84% 39%',
  orange: '25 95% 53%',
  pink: '330 81% 60%',
  teal: '174 72% 46%',
  red: '0 72% 51%',
  indigo: '239 84% 67%',
};

const ACCENT_STORAGE_KEY = 'servio.accentColor';

function readStoredAccent(): string {
  try {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem(ACCENT_STORAGE_KEY) : null;
    return v && ACCENT_COLORS[v] ? v : DEFAULT_SETTINGS.accentColor;
  } catch {
    return DEFAULT_SETTINGS.accentColor;
  }
}

function writeStoredAccent(color: string) {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(ACCENT_STORAGE_KEY, color);
  } catch { /* ignore */ }
}

export function usePersonalization() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PersonalizationSettings>(() => ({
    ...DEFAULT_SETTINGS,
    accentColor: readStoredAccent(),
  }));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  // Apply accent color to CSS
  useEffect(() => {
    const hsl = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.blue;
    document.documentElement.style.setProperty('--primary', hsl);
    document.documentElement.style.setProperty('--ring', hsl);
  }, [settings.accentColor]);

  // Apply compact layout
  useEffect(() => {
    document.documentElement.classList.toggle('compact-layout', settings.compactLayout);
  }, [settings.compactLayout]);

  const loadSettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('ai_personality, ai_custom_personality, email_signature, accent_color, compact_layout, sidebar_order, sidebar_favorites, dashboard_widgets, quick_actions')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const accent = data.accent_color || 'blue';
        writeStoredAccent(accent);
        setSettings({
          aiPersonality: data.ai_personality || 'neutral',
          aiCustomPersonality: data.ai_custom_personality || '',
          emailSignature: data.email_signature || '',
          accentColor: accent,
          compactLayout: data.compact_layout || false,
          sidebarOrder: data.sidebar_order as string[] | null,
          sidebarFavorites: (data.sidebar_favorites as string[]) || [],
          dashboardWidgets: data.dashboard_widgets as any,
          quickActions: data.quick_actions as any,
        });
      }
    } catch (e) {
      console.error('Error loading personalization:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(async (updates: Partial<PersonalizationSettings>) => {
    if (!user) return;
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    const dbUpdates: Record<string, any> = {};
    if ('aiPersonality' in updates) dbUpdates.ai_personality = updates.aiPersonality;
    if ('aiCustomPersonality' in updates) dbUpdates.ai_custom_personality = updates.aiCustomPersonality;
    if ('emailSignature' in updates) dbUpdates.email_signature = updates.emailSignature;
    if ('accentColor' in updates) dbUpdates.accent_color = updates.accentColor;
    if ('compactLayout' in updates) dbUpdates.compact_layout = updates.compactLayout;
    if ('sidebarOrder' in updates) dbUpdates.sidebar_order = updates.sidebarOrder;
    if ('sidebarFavorites' in updates) dbUpdates.sidebar_favorites = updates.sidebarFavorites;
    if ('dashboardWidgets' in updates) dbUpdates.dashboard_widgets = updates.dashboardWidgets;
    if ('quickActions' in updates) dbUpdates.quick_actions = updates.quickActions;

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ ...dbUpdates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) throw error;
    } catch (e) {
      console.error('Error saving personalization:', e);
    }
  }, [user, settings]);

  const saveAiCorrection = useCallback(async (emailId: string | null, originalReply: string, correctedReply: string, tone?: string) => {
    if (!user) return;
    try {
      await supabase.from('ai_corrections').insert({
        user_id: user.id,
        email_id: emailId,
        original_reply: originalReply,
        corrected_reply: correctedReply,
        tone: tone || settings.aiPersonality,
      });
    } catch (e) {
      console.error('Error saving AI correction:', e);
    }
  }, [user, settings.aiPersonality]);

  const getRecentCorrections = useCallback(async (limit = 5): Promise<{ original_reply: string; corrected_reply: string }[]> => {
    if (!user) return [];
    try {
      const { data } = await supabase
        .from('ai_corrections')
        .select('original_reply, corrected_reply')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      return data || [];
    } catch { return []; }
  }, [user]);

  return {
    settings,
    isLoading,
    updateSettings,
    saveAiCorrection,
    getRecentCorrections,
    accentColors: ACCENT_COLORS,
    DEFAULT_SETTINGS,
  };
}
