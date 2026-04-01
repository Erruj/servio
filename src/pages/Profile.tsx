import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sidebar } from '@/components/Sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ChevronLeft, Camera, Trash2, Shield, Download, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Profile() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAvatarUrl((data as any).avatar_url || null);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Fout', description: 'Alleen afbeeldingen zijn toegestaan.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Fout', description: 'Afbeelding is te groot (max 5MB).', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: url } as any).eq('id', user.id);
      setAvatarUrl(url);
      toast({ title: 'Profielfoto bijgewerkt' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload mislukt', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    try {
      await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);
      await supabase.from('profiles').update({ avatar_url: null } as any).eq('id', user.id);
      setAvatarUrl(null);
      toast({ title: 'Profielfoto verwijderd' });
    } catch { toast({ title: 'Fout', variant: 'destructive' }); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, company_name: companyName })
        .eq('id', user!.id);
      if (error) throw error;
      toast({ title: 'Profiel opgeslagen', description: 'Je profielgegevens zijn bijgewerkt.' });
    } catch (error) {
      toast({ title: 'Fout', description: 'Profiel kon niet worden opgeslagen.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // GDPR: Export all user data
  const handleExportData = async () => {
    if (!user) return;
    setExportingData(true);
    try {
      const [profileRes, emailsRes, settingsRes, invoicesRes, receiptsRes, documentsRes, transactionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id),
        supabase.from('emails').select('*').eq('user_id', user.id),
        supabase.from('user_settings').select('*').eq('user_id', user.id),
        supabase.from('invoices').select('*').eq('user_id', user.id),
        supabase.from('receipts').select('*').eq('user_id', user.id),
        supabase.from('documents').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        profile: profileRes.data,
        settings: settingsRes.data,
        emails: emailsRes.data,
        invoices: invoicesRes.data,
        receipts: receiptsRes.data,
        documents: documentsRes.data,
        transactions: transactionsRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `servio-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Data geëxporteerd', description: 'Je volledige data is gedownload.' });
    } catch {
      toast({ title: 'Export mislukt', variant: 'destructive' });
    } finally {
      setExportingData(false);
    }
  };

  // GDPR: Delete account
  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      // Delete user data from all tables
      await Promise.all([
        supabase.from('emails').delete().eq('user_id', user.id),
        supabase.from('email_connections').delete().eq('user_id', user.id),
        supabase.from('invoices').delete().eq('user_id', user.id),
        supabase.from('receipts').delete().eq('user_id', user.id),
        supabase.from('documents').delete().eq('user_id', user.id),
        supabase.from('transactions').delete().eq('user_id', user.id),
        supabase.from('usage_tracking').delete().eq('user_id', user.id),
        supabase.from('ai_insights').delete().eq('user_id', user.id),
        supabase.from('user_roles').delete().eq('user_id', user.id),
        supabase.from('categories').delete().eq('user_id', user.id),
        supabase.from('suppliers').delete().eq('user_id', user.id),
      ]);
      
      // Sign out
      await signOut();
      toast({ title: 'Account verwijderd', description: 'Je account en alle gegevens zijn verwijderd.' });
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    }
  };

  const initials = fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : email?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Terug
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground">Profiel</h1>
            <p className="text-muted-foreground">Beheer je persoonlijke gegevens</p>
          </div>

          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>Profielfoto</CardTitle>
              <CardDescription>Upload een profielfoto (max 5MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                    {uploading ? 'Uploaden...' : 'Foto uploaden'}
                  </Button>
                  {avatarUrl && (
                    <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Verwijderen
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile info */}
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
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Je volledige naam" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mailadres</Label>
                    <Input value={email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Je e-mailadres kan niet worden gewijzigd.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Bedrijfsnaam</Label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Je bedrijfsnaam (optioneel)" maxLength={200} />
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Opslaan
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Beveiliging</CardTitle>
              <CardDescription>Beveilig je account met tweestapsverificatie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Tweestapsverificatie (2FA)</p>
                  <p className="text-sm text-muted-foreground">Voeg een extra beveiligingslaag toe via een authenticator app</p>
                </div>
                <Button variant="outline" onClick={() => {
                  // Supabase MFA enrollment
                  supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Servio 2FA' }).then(({ data, error }) => {
                    if (error) { toast({ title: '2FA setup mislukt', description: error.message, variant: 'destructive' }); return; }
                    if (data?.totp?.qr_code) {
                      window.open(data.totp.qr_code, '_blank');
                      toast({ title: '2FA QR-code geopend', description: 'Scan de QR-code met je authenticator app.' });
                    }
                  });
                }}>
                  2FA Inschakelen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* GDPR / Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Privacy & Gegevens (AVG)</CardTitle>
              <CardDescription>Beheer je persoonlijke gegevens conform de AVG/GDPR</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Gegevens exporteren</p>
                  <p className="text-sm text-muted-foreground">Download al je opgeslagen gegevens als JSON</p>
                </div>
                <Button variant="outline" onClick={handleExportData} disabled={exportingData}>
                  {exportingData ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Exporteren
                </Button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="font-medium text-destructive">Account verwijderen</p>
                  <p className="text-sm text-muted-foreground">Verwijder je account en alle bijbehorende gegevens permanent</p>
                </div>
                <Button variant="destructive" onClick={() => setShowDeleteAccount(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Verwijderen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Account definitief verwijderen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Al je gegevens worden permanent verwijderd: emails, facturen, bonnetjes, documenten, instellingen en profielinformatie. 
              Dit kan niet ongedaan worden gemaakt. Download eerst je gegevens als je ze wilt bewaren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Definitief verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
