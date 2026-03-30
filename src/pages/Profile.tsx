import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sidebar } from '@/components/Sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ChevronLeft } from 'lucide-react';

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setFullName(data.full_name || '');
      setEmail(data.email || '');
      setCompanyName(data.company_name || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
        })
        .eq('id', user!.id);

      if (error) throw error;
      toast({ title: 'Profiel opgeslagen', description: 'Je profielgegevens zijn bijgewerkt.' });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Fout', description: 'Profiel kon niet worden opgeslagen.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Terug
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground">Profiel</h1>
            <p className="text-muted-foreground">Beheer je persoonlijke gegevens</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Persoonlijke informatie</CardTitle>
              <CardDescription>Wijzig je naam en bedrijfsgegevens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Volledige naam</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Je volledige naam" />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mailadres</Label>
                    <Input value={email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Je e-mailadres kan niet worden gewijzigd.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Bedrijfsnaam</Label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Je bedrijfsnaam (optioneel)" />
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Opslaan
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
