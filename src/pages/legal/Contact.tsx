import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SeoHead } from '@/components/SeoHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export default function Contact() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const contactSchema = z.object({
    name: z.string().trim().min(2, t('marketing.contact.nameError')).max(100),
    email: z.string().trim().email(t('marketing.contact.emailError')).max(255),
    message: z.string().trim().min(10, t('marketing.contact.messageError')).max(2000)
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      contactSchema.parse(formData);
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: t('marketing.contact.sent'),
        description: t('marketing.contact.sentDesc')
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isEn ? 'Contact – Get in Touch with Servio | AI Business Assistant' : 'Contact – Neem Contact op met Servio | AI Bedrijfsassistent';
  const description = isEn
    ? 'Get in touch with Servio. We are happy to help with all your questions about our AI business assistant. Reply within 24 hours.'
    : 'Neem contact op met Servio. We helpen je graag met al je vragen over onze AI bedrijfsassistent. Reactie binnen 24 uur.';

  return (
    <>
      <SeoHead path="/contact" title={title} description={description} />

      <div className="min-h-screen bg-background">
        <LandingHeader />

        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
                  {t('marketing.contact.title')}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t('marketing.contact.subtitle')}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <Card className="text-center p-6">
                  <CardContent className="pt-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{t('marketing.contact.email')}</h3>
                    <a href="mailto:info@getservio.co" className="text-muted-foreground text-sm hover:text-primary transition-colors">info@getservio.co</a>
                  </CardContent>
                </Card>

                <Card className="text-center p-6">
                  <CardContent className="pt-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{t('marketing.contact.location')}</h3>
                    <p className="text-muted-foreground text-sm">{t('marketing.contact.locationValue')}</p>
                  </CardContent>
                </Card>

                <Card className="text-center p-6">
                  <CardContent className="pt-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{t('marketing.contact.responseTime')}</h3>
                    <p className="text-muted-foreground text-sm">{t('marketing.contact.responseTimeValue')}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl">{t('marketing.contact.formTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('marketing.contact.name')}</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('marketing.contact.yourName')}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('emailAddress')}</Label>
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
                      <Label htmlFor="message">{t('marketing.contact.message')}</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder={t('marketing.contact.messagePlaceholder')}
                        rows={5}
                        className={errors.message ? 'border-destructive' : ''}
                      />
                      {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? t('sending') : t('marketing.contact.send')}
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
