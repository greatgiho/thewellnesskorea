import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

const bodyStyle = {
  backgroundColor: "#f5f5f4",
  margin: "0",
  padding: "24px 0",
}

const containerStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 32px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const brandStyle = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "18px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  marginBottom: "32px",
  display: "block" as const,
}

const footerStyle = {
  fontSize: "12px",
  color: "#999",
  margin: "0",
}

export type BaseEmailProps = {
  preview: string
  children: React.ReactNode
}

export function BaseEmail({ preview, children }: BaseEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section>
            <span style={brandStyle}>The Wellness Korea</span>
          </Section>

          {children}

          <Hr style={{ borderColor: "#e5e5e5", margin: "32px 0" }} />
          <Text style={footerStyle}>
            The Wellness Korea · Brickwell, Seochon, Seoul
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Shared style tokens
export const styles = {
  p: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#1a1a1a",
    margin: "0 0 16px",
  },
  pMuted: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#666",
    margin: "0 0 12px",
  },
  label: {
    fontSize: "14px",
    color: "#888",
    width: "120px",
    padding: "8px 0",
    verticalAlign: "top" as const,
    borderBottom: "1px solid #f0f0f0",
  },
  value: {
    fontSize: "14px",
    color: "#1a1a1a",
    fontWeight: "500" as const,
    padding: "8px 0",
    verticalAlign: "top" as const,
    borderBottom: "1px solid #f0f0f0",
  },
  button: {
    display: "inline-block" as const,
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
    textDecoration: "none",
    padding: "12px 24px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500" as const,
  },
  link: {
    color: "#666",
    fontSize: "13px",
  },
}
