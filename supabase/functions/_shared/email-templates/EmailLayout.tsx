/// <reference types="npm:@types/react@18.3.1" />

// ═══════════════════════════════════════════════════════════════════════════
//  GEDEELDE OPMAAK VOOR ALLE SERVIO-E-MAILS
//  Logo, witte kaart, knop en voettekst. Teksten staan in texts.ts.
// ═══════════════════════════════════════════════════════════════════════════

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { brand, styles } from './brand.ts'
import { emailTexts } from './texts.ts'

export interface EmailLayoutProps {
  preview: string
  heading: string
  paragraphs: string[]
  buttonLabel?: string
  buttonUrl?: string
  code?: string
  note?: string
  subNote?: string
  warning?: string
  signature?: string
  icon?: string
  footnote?: string
  /** Optioneel detailblokje, bv. Pakket / Prijs / Volgende factuurdatum */
  details?: Array<{ label: string; value: string }>
}

export const EmailLayout = ({
  preview,
  heading,
  paragraphs,
  buttonLabel,
  buttonUrl,
  code,
  note,
  subNote,
  warning,
  signature,
  icon,
  footnote,
  details,
}: EmailLayoutProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={styles.main}>
      <Container style={styles.outerContainer}>
        <Section style={styles.card}>
          <Section style={styles.logoSection}>
            <Img
              src={brand.logoUrl}
              alt={brand.name}
              width="34"
              height="34"
              style={styles.logoImage}
            />
            <Text style={styles.logoText}>{brand.name}</Text>
          </Section>

          <Hr style={styles.divider} />

          {icon ? <Text style={styles.icon}>{icon}</Text> : null}

          <Heading style={styles.h1}>{heading}</Heading>


          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.text}>
              {paragraph}
            </Text>
          ))}

          {code ? <Text style={styles.code}>{code}</Text> : null}

          {details && details.length > 0 ? (
            <Section style={styles.detailsBox}>
              {details.map((detail) => (
                <Text key={detail.label} style={styles.detailRow}>
                  <span style={styles.detailLabel}>{detail.label}: </span>
                  <span style={styles.detailValue}>{detail.value}</span>
                </Text>
              ))}
            </Section>
          ) : null}

          {buttonLabel && buttonUrl ? (
            <Section style={styles.buttonContainer}>
              <Button style={styles.button} href={buttonUrl}>
                {buttonLabel}
              </Button>
            </Section>
          ) : null}

          {note ? <Text style={styles.note}>{note}</Text> : null}

          {subNote ? <Text style={styles.subNote}>{subNote}</Text> : null}

          {warning ? <Text style={styles.warning}>{warning}</Text> : null}

          {signature ? <Text style={styles.signature}>{signature}</Text> : null}


          {footnote ? (
            <>
              <Hr style={styles.divider} />
              <Text style={{ ...styles.footer, marginBottom: '12px' }}>{footnote}</Text>
            </>
          ) : (
            <Hr style={styles.divider} />
          )}

          <Text style={styles.footer}>
            © {new Date().getFullYear()} {emailTexts.footer}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailLayout
