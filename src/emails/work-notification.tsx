import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { CSSProperties } from "react";

interface WorkNotificationEmailProps {
  recipientName: string;
  workTitle: string;
  workType: string;
  action: string;
  actionDescription: string;
  workUrl: string;
}

export default function WorkNotificationEmail({
  recipientName,
  workTitle,
  workType,
  action,
  actionDescription,
  workUrl,
}: WorkNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Quark: {action} - {workTitle}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={label}>QUARK</Text>
          <Heading style={h1}>{action}</Heading>
          <div style={underline} />

          <Text style={text}>Hi {recipientName},</Text>

          <Text style={text}>{actionDescription}</Text>

          <div style={workCard}>
            <Text style={cardTitle}>{workTitle}</Text>
            <Text style={workMeta}>Type: {workType}</Text>
          </div>

          <div style={buttonSection}>
            <Button style={button} href={workUrl}>
              View in Quark
            </Button>
          </div>

          <Hr style={hr} />

          <Text style={footer}>
            © {new Date().getFullYear()} Quark. Multi-agent task orchestration.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: "40px 0",
};

const container: CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 32px",
  maxWidth: "480px",
  border: "1px solid #e4e4e7",
};

const label: CSSProperties = {
  color: "#6366f1",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const h1: CSSProperties = {
  color: "#09090b",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0 0 12px",
  padding: "0",
  textAlign: "left",
};

const underline: CSSProperties = {
  width: "48px",
  height: "3px",
  backgroundColor: "#6366f1",
  marginBottom: "24px",
};

const text: CSSProperties = {
  color: "#52525b",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
  textAlign: "left",
};

const workCard: CSSProperties = {
  backgroundColor: "#f4f4f5",
  padding: "16px 20px",
  borderRadius: "8px",
  marginBottom: "24px",
};

const cardTitle: CSSProperties = {
  color: "#09090b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 4px",
};

const workMeta: CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  margin: "0",
};

const buttonSection: CSSProperties = {
  textAlign: "left",
  margin: "0 0 28px",
};

const button: CSSProperties = {
  backgroundColor: "#6366f1",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "12px 32px",
};

const hr: CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "32px 0 16px",
};

const footer: CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center",
  margin: "0",
};
