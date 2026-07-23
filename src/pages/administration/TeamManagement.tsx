import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminBreadcrumb } from '@/components/AdminBreadcrumb';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Mail, Trash2, UserPlus, Users } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  email?: string;
  full_name?: string;
}

export default function TeamManagement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('agent');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, [user]);

  const loadTeamMembers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      const members = (roles || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        role: r.role,
        email: r.profiles?.email,
        full_name: r.profiles?.full_name,
      }));

      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error(t('pleaseEnterEmail') || 'Voer een e-mailadres in');
      return;
    }

    try {
      setLoading(true);
      
      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

      const { error } = await supabase
        .from('team_invitations')
        .insert([{
          inviter_id: user!.id,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole as Database['public']['Enums']['app_role'],
          token,
          expires_at: expiresAt.toISOString(),
        }]);

      if (error) throw error;

      toast.success(t('invitationSent') || 'Uitnodiging verstuurd');
      setInviteEmail('');
      setInviteRole('agent');
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as Database['public']['Enums']['app_role'] })
        .eq('id', memberId);

      if (error) throw error;

      toast.success(t('roleUpdated') || 'Rol bijgewerkt');
      loadTeamMembers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', deleteTarget);

      if (error) throw error;

      toast.success(t('memberRemoved') || 'Teamlid verwijderd');
      setDeleteTarget(null);
      loadTeamMembers();
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast.error(error.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'finance': return 'outline';
      case 'agent': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <AdminBreadcrumb currentPage="Teambeheer" />
      <PageHeader
        title={t('teamManagement') || 'Teambeheer'}
        description={t('teamManagementDescription') || 'Beheer teamleden en hun rollen'}
      />

      {/* Invite new member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('inviteTeamMember') || 'Teamlid uitnodigen'}
          </CardTitle>
          <CardDescription>{t('inviteTeamMemberDescription') || 'Verstuur een uitnodiging naar een nieuw teamlid'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('email') || 'E-mail'}</Label>
              <Input
                type="email"
                placeholder="naam@voorbeeld.nl"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('role') || 'Rol'}</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">{t('owner') || 'Eigenaar'}</SelectItem>
                  <SelectItem value="admin">{t('admin') || 'Beheerder'}</SelectItem>
                  <SelectItem value="agent">{t('agent') || 'Support Agent'}</SelectItem>
                  <SelectItem value="finance">{t('finance') || 'Financieel'}</SelectItem>
                  <SelectItem value="viewer">{t('viewer') || 'Kijker'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleInvite} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                {t('sendInvitation') || 'Uitnodiging versturen'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team members list */}
      <Card>
        <CardHeader>
          <CardTitle>{t('teamMembers') || 'Teamleden'}</CardTitle>
          <CardDescription>{t('manageExistingTeamMembers') || 'Beheer bestaande teamleden en hun rollen'}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && teamMembers.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : teamMembers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t('noTeamMembers') || 'Nog geen teamleden'}
              description="Nodig collega's uit om samen te werken in Servio."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name') || 'Naam'}</TableHead>
                  <TableHead>{t('email') || 'E-mail'}</TableHead>
                  <TableHead>{t('role') || 'Rol'}</TableHead>
                  <TableHead className="text-right">{t('actions') || 'Acties'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.full_name || t('unknown')}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {t(member.role) || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleUpdateRole(member.id, value)}
                          disabled={member.user_id === user?.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">{t('owner')}</SelectItem>
                            <SelectItem value="admin">{t('admin')}</SelectItem>
                            <SelectItem value="agent">{t('agent')}</SelectItem>
                            <SelectItem value="finance">{t('finance')}</SelectItem>
                            <SelectItem value="viewer">{t('viewer')}</SelectItem>
                          </SelectContent>
                        </Select>

                        {member.user_id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(member.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t('removeTeamMember') || 'Teamlid verwijderen'}
        description={t('removeTeamMemberConfirm') || 'Weet je zeker dat je dit teamlid wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.'}
        confirmLabel={t('remove') || 'Verwijderen'}
        cancelLabel={t('cancel') || 'Annuleren'}
        onConfirm={handleDeleteMember}
        loading={loading}
      />
    </div>
  );
}
