import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowLeft, User, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateInput } from '@/lib/security';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!validateInput(formData.name, 'name').isValid) {
      newErrors.name = 'Naam is verplicht (2-50 karakters)';
    }
    
    if (!validateInput(formData.email, 'email').isValid) {
      newErrors.email = 'Geldig email adres is verplicht';
    }
    
    if (!validateInput(formData.password, 'password').isValid) {
      newErrors.password = 'Wachtwoord moet minimaal 8 karakters bevatten';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "🎉 Account aangemaakt!",
        description: "Welkom bij Servio. Je wordt doorgeleid naar je dashboard.",
      });
      
      setIsLoading(false);
      navigate('/');
    }, 2000);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
              Maak je account aan en begin binnen 2 minuten met AI-klantenservice
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
                <Label htmlFor="name" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Volledige naam</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Je volledige naam"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email adres</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="je@bedrijf.nl"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
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
                  placeholder="Minimaal 8 karakters"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full shadow-card" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
                <span className="text-primary cursor-pointer hover:underline">Algemene Voorwaarden</span>
                {' '}en{' '}
                <span className="text-primary cursor-pointer hover:underline">Privacybeleid</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back button */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pricing')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar pricing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Signup;