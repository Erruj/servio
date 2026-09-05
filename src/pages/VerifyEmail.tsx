import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MailCheck, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

/**
 * Scherm na registratie: "controleer je inbox om je account te bevestigen".
 * Wordt gebruikt zodra Supabase Auth "Confirm email" aan staat en signUp
 * dus géén sessie teruggeeft.
 */
const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const stateEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [email] = useState(stateEmail);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Al bevestigd en ingelogd? Dan direct doorsturen.
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      setError('We weten je e-mailadres niet meer. Registreer opnieuw of log in om een nieuwe bevestigingsmail te ontvangen.');
      return;
    }
    setError(null);
    setIsSending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (resendError) {
        setError(
          resendError.message.toLowerCase().includes('rate')
            ? 'Je hebt net al een bevestigingsmail aangevraagd. Wacht een minuut en probeer het opnieuw.'
            : `Versturen mislukt: ${resendError.message}`
        );
        return;
      }
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast({
        title: 'Bevestigingsmail verstuurd',
        description: `We hebben opnieuw een e-mail gestuurd naar ${email}.`,
      });
    } catch (e) {
      setError('Versturen mislukt door een onverwachte fout. Probeer het later opnieuw.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-elevated">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto p-3 bg-primary/10 rounded-2xl w-fit">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Controleer je inbox</CardTitle>
            <CardDescription>
              {email ? (
                <>
                  We hebben een bevestigingsmail gestuurd naar{' '}
                  <span className="font-medium text-foreground">{email}</span>. Klik op de link in die
                  e-mail om je account te activeren.
                </>
              ) : (
                <>
                  We hebben je een bevestigingsmail gestuurd. Klik op de link in die e-mail om je
                  account te activeren.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
              <p>Geen mail ontvangen?</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Kijk in je spam- of ongewenste-mailmap</li>
                <li>Controleer of je e-mailadres klopt</li>
                <li>Het kan tot een paar minuten duren</li>
              </ul>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleResend}
              disabled={isSending || cooldown > 0}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Versturen...
                </>
              ) : cooldown > 0 ? (
                `Opnieuw versturen kan over ${cooldown}s`
              ) : (
                'Bevestigingsmail opnieuw versturen'
              )}
            </Button>

            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link to="/login">Ik heb bevestigd — inloggen</Link>
            </Button>

            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Terug naar de website
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
