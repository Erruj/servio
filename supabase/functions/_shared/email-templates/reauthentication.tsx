/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://getservio.co/favicon.png'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je verificatiecode</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Servio" width="40" height="40" style={logo} />
        <Heading style={h1}>Identiteit bevestigen</Heading>
        <Text style={text}>Gebruik onderstaande code om je identiteit te bevestigen:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Deze code verloopt binnenkort. Als je dit niet hebt aangevraagd, kun je deze e-mail veilig negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 25px' }
const logo = { marginBottom: '20px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1e293b', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: '0 0 25px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#3b82f6', margin: '0 0 30px', letterSpacing: '4px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '30px 0 0' }
