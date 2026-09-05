import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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

// Only columns the `authenticated` role has SELECT privileges on.
// NOTE: stripe_* / subscription_product_id are intentionally NOT readable by
// clients, so never use select('*') on user_settings.
const PERSONALIZATION_COLUMNS =
  'ai_personality, ai_custom_personality, email_signature, accent_color, compact_layout, sidebar_order, sidebar_favorites, dashboard_widgets, quick_actions';

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

const PERSONALIZATION_QUERY_KEY = ['personalization'] as const;

async function fetchPersonalization(userId: string): Promise<PersonalizationSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select(PERSONALIZATION_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { ...DEFAULT_SETTINGS, accentColor: readStoredAccent() };

  const d = data as any;
  const accent = d.accent_color || 'blue';
  writeStoredAccent(accent);

  return {
    aiPersonality: d.ai_personality || 'neutral',
    aiCustomPersonality: d.ai_custom_personality || '',
    emailSignature: d.email_signature || '',
    accentColor: accent,
    compactLayout: d.compact_layout || false,
    sidebarOrder: d.sidebar_order as string[] | null,
    sidebarFavorites: (d.sidebar_favorites as string[]) || [],
    dashboardWidgets: d.dashboard_widgets as any,
    quickActions: d.quick_actions as any,
  };
}

export function usePersonalization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Single shared query — one fetch per session regardless of how many
  // components call this hook.
  const { data, isLoading, error } = useQuery({
    queryKey: PERSONALIZATION_QUERY_KEY,
    queryFn: () => fetchPersonalization(user!.id),
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const settings: PersonalizationSettings = data ?? {
    ...DEFAULT_SETTINGS,
    accentColor: readStoredAccent(),
  };

  // Visible error instead of a silent console.error
  useEffect(() => {
    if (!error) return;
    console.error('Error loading personalization:', error);
    toast.error('Kon je voorkeuren niet laden', {
      id: 'personalization-load-error',
      description:
        (error as any)?.message || 'Er ging iets mis bij het ophalen van je persoonlijke instellingen. Vernieuw de pagina of probeer het later opnieuw.',
    });
  }, [error]);

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

  const updateSettings = useCallback(async (updates: Partial<PersonalizationSettings>) => {
    if (!user) return;
    if ('accentColor' in updates && updates.accentColor) writeStoredAccent(updates.accentColor);

    // Optimistic update of the shared cache
    queryClient.setQueryData<PersonalizationSettings>(PERSONALIZATION_QUERY_KEY, (prev) => ({
      ...(prev ?? settings),
      ...updates,
    }));

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
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ ...dbUpdates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) throw updateError;
    } catch (e: any) {
      console.error('Error saving personalization:', e);
      toast.error('Kon je voorkeuren niet opslaan', {
        id: 'personalization-save-error',
        description: e?.message || 'Probeer het opnieuw.',
      });
      queryClient.invalidateQueries({ queryKey: PERSONALIZATION_QUERY_KEY });
    }
  }, [user, settings, queryClient]);

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
      const { data: rows } = await supabase
        .from('ai_corrections')
        .select('original_reply, corrected_reply')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      return rows || [];
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
