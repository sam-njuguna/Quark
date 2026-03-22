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
} from "@react-email/components";

interface TeamInviteEmailProps {
  inviteUrl: string;
  teamName: string;
  invitedByName: string;
  role: string;
}

export default function TeamInviteEmail({
  inviteUrl,
  teamName,
  invitedByName,
  role,
}: TeamInviteEmailProps) {
  const logoUrl = process.env.EMAIL_LOGO_URL;

  const roleLabel = role === "admin" ? "Admin" : role === "lead" ? "Lead" : "Member";

  return (
    <Html>
      <Head />
      <Preview>You have been invited to join {teamName} on Quark</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && (
            <Section style={logoSection}>
              <Img
                src={logoUrl}
                width="48"
                height="48"
                alt="Quark"
                style={logo}
              />
            </Section>
          )}

          <Text style={label}>TEAM INVITATION</Text>
          <Heading style={h1}>You&apos;re Invited</Heading>
          <div style={underline} />

          <Text style={text}>
            <strong>{invitedByName}</strong> has invited you to join{" "}
            <strong>{teamName}</strong> on Quark as a{" "}
            <strong>{roleLabel}</strong>.
          </Text>

          <Text style={textSmall}>
            Click the button below to review the invitation and join the team.
            This invitation expires in 7 days.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={inviteUrl}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={textSmall}>
            If you didn&apos;t expect this invitation, you can safely ignore this
            email.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            &copy; {new Date().getFullYear()} Quark. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 32px",
  maxWidth: "480px",
  border: "1px solid #e4e4e7",
};

const logoSection = {
  textAlign: "left" as const,
  marginBottom: "24px",
};

const logo = {};

const label = {
  color: "#7c3aed",
  fontSize: "12px",
  fontWeight: "700" as const,
  letterSpacing: "1.5px",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
};

const h1 = {
  color: "#09090b",
  fontSize: "28px",
  fontWeight: "700" as const,
  margin: "0 0 12px",
  padding: "0",
  textAlign: "left" as const,
};

const underline = {
  width: "48px",
  height: "3px",
  backgroundColor: "#7c3aed",
  marginBottom: "24px",
};

const text = {
  color: "#52525b",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
  textAlign: "left" as const,
};

const textSmall = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 16px",
  textAlign: "left" as const,
};

const buttonSection = {
  textAlign: "left" as const,
  margin: "0 0 28px",
};

const button = {
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const hr = {
  borderColor: "#e4e4e7",
  margin: "32px 0 16px",
};

const footer = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "0",
};
