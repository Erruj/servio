/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Wachtwoord herstellen voor {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Wachtwoord herstellen</Heading>
        <Text style={text}>
          We hebben een verzoek ontvangen om je wachtwoord voor {siteName} te herstellen. Klik op onderstaande knop om een nieuw wachtwoord in te stellen.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Wachtwoord resetten
        </Button>
        <Text style={footer}>
          Als je dit niet hebt aangevraagd, kun je deze e-mail veilig negeren. Je wachtwoord wordt niet gewijzigd.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1e293b', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: '0 0 25px' }
const button = { backgroundColor: '#3b82f6', color: '#ffffff', fontSize: '15px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '30px 0 0' }
