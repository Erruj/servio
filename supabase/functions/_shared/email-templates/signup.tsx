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
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://getservio.co/favicon.png'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Bevestig je e-mailadres voor {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Servio" width="40" height="40" style={logo} />
        <Heading style={h1}>Welkom bij Servio! 🎉</Heading>
        <Text style={text}>
          Bedankt voor je registratie bij{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Bevestig je e-mailadres (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) door op onderstaande knop te klikken:
        </Text>
        <Button style={button} href={confirmationUrl}>
          E-mailadres bevestigen
        </Button>
        <Text style={footer}>
          Als je geen account hebt aangemaakt, kun je deze e-mail veilig negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px' }
const logo = { marginBottom: '20px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1e293b', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: '0 0 25px' }
const link = { color: '#3b82f6', textDecoration: 'underline' }
const button = { backgroundColor: '#3b82f6', color: '#ffffff', fontSize: '15px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '30px 0 0' }
