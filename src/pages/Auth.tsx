import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User, AlertCircle, Check, X } from 'lucide-react';
import servioLogo from '@/assets/servio-logo-full.png';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { z } from 'zod';

const checkPasswordRequirements = (password: string) => ({
  minLength: password.length >= 6,
  hasNumber: /\d/.test(password),
  hasLetter: /[a-zA-Z]/.test(password),
});

export default function Auth() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', confirmPassword: '', fullName: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn, signUp, resetPassword, isLoading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const signInSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('invalidEmail')).max(255),
        password: z.string().min(6, t('passwordMinLength')),
      }),
    [t]
  );

  const signUpSchema = useMemo(
    () =>
      z
        .object({
          email: z.string().email(t('invalidEmail')).max(255),
          password: z.string().min(6, t('passwordMinLength')),
          confirmPassword: z.string(),
          fullName: z.string().trim().min(2, t('nameMinLength')).max(100),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('passwordsDontMatch'),
          path: ['confirmPassword'],
        }),
    [t]
  );

  const resetSchema = useMemo(
    () => z.object({ email: z.string().email(t('invalidEmail')).max(255) }),
    [t]
  );

  const handleTabChange = (tab: string) => {
    setErrors({});
    setActiveTab(tab as 'signin' | 'signup' | 'reset');
  };

  const passwordRequirements = useMemo(
    () => checkPasswordRequirements(signUpData.password),
    [signUpData.password]
  );

  // Honor ?next= for OAuth consent (MCP) or other same-origin returns.
  const nextParam = new URLSearchParams(window.location.search).get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  if (user) {
    if (safeNext) {
      window.location.href = safeNext;
      return null;
    }
    navigate('/dashboard');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const validated = signInSchema.parse(signInData);
      const { error } = await signIn(validated.email, validated.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ form: t('invalidCredentials') });
        } else {
          setErrors({ form: error.message });
        }
      } else {
        toast({ title: t('welcomeBack'), description: t('successfullySignedIn') });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const validated = signUpSchema.parse(signUpData);
      const { error } = await signUp(validated.email, validated.password, validated.fullName);
      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ form: t('emailAlreadyRegistered') });
        } else {
          setErrors({ form: error.message });
        }
      } else {
        toast({ title: t('accountCreated'), description: t('verifyEmailDescription') });
        setActiveTab('signin');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const validated = resetSchema.parse({ email: resetEmail });
      const { error } = await resetPassword(validated.email);
      if (error) {
        setErrors({ form: error.message });
      } else {
        toast({ title: t('emailSent'), description: t('checkInboxResetPassword') });
        setActiveTab('signin');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ email: error.errors[0].message });
      }
    }
  };

  const PasswordRequirementIndicator = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-success' : 'text-muted-foreground'}`}>
      {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-end">
            <LanguageSwitcher variant="app" />
          </div>
          <div className="flex justify-center">
            <img src={servioLogo} alt="Servio" className="h-12 w-auto" />
          </div>
          <div className="space-y-2">
            <CardDescription className="text-base leading-relaxed">{t('authSubtitle')}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {t('signinTab')}
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {t('signupTab')}
              </TabsTrigger>
              <TabsTrigger value="reset" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {t('resetTab')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {t('emailAddress')}
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    placeholder={t('emailPlaceholder')}
                    className="h-11"
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    {t('password')}
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    placeholder="••••••••"
                    className="h-11"
                    required
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {errors.form && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.form}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  {t('login')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {t('fullName')}
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    placeholder={t('namePlaceholder')}
                    className="h-11"
                    required
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {t('emailAddress')}
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    placeholder={t('emailPlaceholder')}
                    className="h-11"
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    {t('password')}
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    placeholder="••••••••"
                    className="h-11"
                    required
                  />
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2">{t('passwordRequirements')}</p>
                    <PasswordRequirementIndicator met={passwordRequirements.minLength} text={t('minSixChars')} />
                    <PasswordRequirementIndicator met={passwordRequirements.hasLetter} text={t('atLeastOneLetter')} />
                    <PasswordRequirementIndicator met={passwordRequirements.hasNumber} text={t('atLeastOneNumber')} />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    {t('confirmPasswordLabel')}
                  </Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="h-11"
                    required
                  />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                {errors.form && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.form}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <User className="h-4 w-4 mr-2" />}
                  {t('createAccountBtn')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="reset" className="space-y-4">
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('resetEmailDesc')}</p>
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {t('emailAddress')}
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="h-11"
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                {errors.form && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.form}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  {t('resetPasswordBtn')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {t('backToHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
