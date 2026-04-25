/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://getservio.co/servio-logo-full.png'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Wachtwoord opnieuw instellen – {siteName}</Preview>
    <Body style={main}>
      <Container style={outerContainer}>
        <Section style={card}>
          {/* Logo area */}
          <Section style={logoSection}>
            <Img src={LOGO_URL} alt="Servio" width="120" height="40" style={{ display: 'block', margin: '0 auto' }} />
          </Section>

          <Hr style={divider} />

          <Heading style={h1}>Wachtwoord opnieuw instellen</Heading>

          <Text style={greeting}>Hallo,</Text>

          <Text style={text}>
            Je hebt een verzoek ingediend om je wachtwoord te resetten. Klik op de knop hieronder om een nieuw wachtwoord in te stellen. Als je dit niet zelf hebt aangevraagd, kun je deze email veilig negeren.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Wachtwoord opnieuw instellen
            </Button>
          </Section>

          <Text style={linkExpiry}>
            Deze link is 24 uur geldig.
          </Text>

          <Hr style={divider} />

          <Text style={footer}>
            © 2026 Servio · getservio.co · Je ontvangt deze email omdat je een account hebt bij Servio.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = {
  backgroundColor: '#f5f5f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '40px 0',
}

const outerContainer = {
  maxWidth: '480px',
  margin: '0 auto',
  padding: '20px',
}

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '40px 32px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '8px',
}

const logoText = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#3b82f6',
  margin: '0',
  letterSpacing: '-0.3px',
}

const logoIcon = {
  marginRight: '6px',
  fontSize: '18px',
}

const divider = {
  borderTop: '1px solid #e5e7eb',
  margin: '20px 0',
}

const h1 = {
  fontSize: '20px',
  fontWeight: '600' as const,
  color: '#1e293b',
  margin: '0 0 20px',
  letterSpacing: '-0.3px',
}

const greeting = {
  fontSize: '15px',
  color: '#374151',
  margin: '0 0 12px',
  lineHeight: '1.6',
}

const text = {
  fontSize: '15px',
  color: '#64748b',
  lineHeight: '1.6',
  margin: '0 0 28px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '0 0 20px',
}

const button = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontSize: '15px',
  borderRadius: '8px',
  padding: '14px 32px',
  textDecoration: 'none',
  fontWeight: '600' as const,
  display: 'inline-block',
}

const linkExpiry = {
  fontSize: '13px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '0 0 8px',
}

const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '0',
  lineHeight: '1.5',
}
