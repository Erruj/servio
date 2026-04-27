import { LegalPage } from '@/components/legal/LegalPage';

export default function PrivacyPolicy() {
  return (
    <LegalPage
      docKey="privacy"
      path="/privacy"
      seoTitleNl="Privacybeleid – Hoe Servio Omgaat met je Gegevens | Servio"
      seoTitleEn="Privacy Policy – How Servio Handles Your Data | Servio"
      seoDescriptionNl="Lees ons privacybeleid en ontdek hoe Servio omgaat met je persoonsgegevens. AVG/GDPR-compliant, EU datacenters."
      seoDescriptionEn="Read our privacy policy and learn how Servio handles your personal data. GDPR-compliant, EU datacenters."
    />
  );
}
