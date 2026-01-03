import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, ArrowLeft, User, Mail, Lock, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres').max(255),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters bevatten'),
  confirmPassword: z.string(),
  fullName: z.string().trim().min(2, 'Naam moet minimaal 2 karakters bevatten').max(100)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

const checkPasswordRequirements = (password: string) => ({
  minLength: password.length >= 6,
  hasNumber: /\d/.test(password),
  hasLetter: /[a-zA-Z]/.test(password),
});

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, isLoading, user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordRequirements = useMemo(() => 
    checkPasswordRequirements(formData.password), 
    [formData.password]
  );

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = signUpSchema.parse(formData);
      const { error } = await signUp(validated.email, validated.password, validated.fullName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ form: 'Dit e-mailadres is al geregistreerd. Probeer in te loggen.' });
        } else if (error.message.includes('Te veel')) {
          setErrors({ form: error.message });
        } else {
          setErrors({ form: 'Er is een fout opgetreden. Probeer het opnieuw.' });
        }
      } else {
        toast({
          title: "Account aangemaakt!",
          description: "Controleer je e-mail om je account te verifiëren."
        });
        navigate('/login');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const PasswordRequirementIndicator = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-success' : 'text-muted-foreground'}`}>
      {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-primary rounded-xl shadow-card">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Servio</h1>
              <p className="text-sm text-muted-foreground">AI-powered support</p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Start je gratis trial</h2>
            <p className="text-muted-foreground mt-2">
              14 dagen gratis, geen creditcard nodig
            </p>
          </div>
        </div>

        {/* Signup Form */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Account aanmaken</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Volledige naam</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Je volledige naam"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={errors.fullName ? 'border-destructive' : ''}
                  required
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>E-mailadres</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="je@bedrijf.nl"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Wachtwoord</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimaal 6 karakters"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={errors.password ? 'border-destructive' : ''}
                  required
                />
                <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Wachtwoord vereisten:</p>
                  <PasswordRequirementIndicator met={passwordRequirements.minLength} text="Minimaal 6 karakters" />
                  <PasswordRequirementIndicator met={passwordRequirements.hasLetter} text="Minstens 1 letter" />
                  <PasswordRequirementIndicator met={passwordRequirements.hasNumber} text="Minstens 1 cijfer (aanbevolen)" />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Bevestig wachtwoord</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Herhaal je wachtwoord"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              {errors.form && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.form}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full shadow-card" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Account wordt aangemaakt...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Maak gratis account aan
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Door je account aan te maken ga je akkoord met onze</p>
              <p>
                <Link to="/terms" className="text-primary hover:underline">Algemene Voorwaarden</Link>
                {' '}en{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacybeleid</Link>
              </p>
            </div>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Heb je al een account? </span>
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inloggen
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back button */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Signup;