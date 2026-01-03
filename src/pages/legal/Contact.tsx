import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Naam moet minimaal 2 karakters bevatten').max(100),
  email: z.string().trim().email('Ongeldig e-mailadres').max(255),
  message: z.string().trim().min(10, 'Bericht moet minimaal 10 karakters bevatten').max(2000)
});

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      contactSchema.parse(formData);
      setIsSubmitting(true);
      
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Bericht verzonden!",
        description: "We nemen zo snel mogelijk contact met je op."
      });
      
      setFormData({ name: '', email: '', message: '' });
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact | Servio</title>
        <meta name="description" content="Neem contact op met Servio. We helpen je graag met al je vragen." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingHeader />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
                  Neem contact op
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Heb je een vraag of wil je meer weten over Servio? We helpen je graag verder.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <Card className="text-center p-6">
                  <CardContent className="pt-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">E-mail</h3>
                    <p className="text-muted-foreground text-sm">info@servio.nl</p>
                  </CardContent>
                </Card>

                <Card className="text-center p-6">
                  <CardContent className="pt-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Locatie</h3>
                    <p className="text-muted-foreground text-sm">Amsterdam, Nederland</p>
                  </CardContent>
                </Card>

                <Card className="text-center p-6">
                  <CardContent className="pt-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Reactietijd</h3>
                    <p className="text-muted-foreground text-sm">Binnen 24 uur</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl">Stuur ons een bericht</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Naam</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Je naam"
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mailadres</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="je@bedrijf.nl"
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Bericht</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Waar kunnen we je mee helpen?"
                        rows={5}
                        className={errors.message ? 'border-destructive' : ''}
                      />
                      {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Verzenden...' : 'Verstuur bericht'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <LandingFooter />
      </div>
    </>
  );
}
