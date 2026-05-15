import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface InviteEmailProps {
  roomCode: string
  propertyName: string
  propertyAddress: string
  depositAmount: number
  inviteUrl: string
}

export function InviteEmail({
  roomCode,
  propertyName,
  propertyAddress,
  depositAmount,
  inviteUrl,
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to join room {roomCode} on Caushun</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 8, overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#011638", padding: "32px 40px" }}>
            <Heading style={{ color: "#ffffff", fontSize: 24, margin: 0 }}>Caushun</Heading>
            <Text style={{ color: "#DFF8EB", margin: "8px 0 0" }}>Rental deposit escrow</Text>
          </Section>
          <Section style={{ padding: "32px 40px" }}>
            <Heading style={{ fontSize: 20, color: "#0d0d0d", marginTop: 0 }}>
              You've been invited
            </Heading>
            <Text style={{ color: "#555", lineHeight: 1.6 }}>
              Your landlord has invited you to set up a security deposit escrow for:
            </Text>
            <Section style={{ backgroundColor: "#f4f4f5", borderRadius: 6, padding: "16px 20px", margin: "16px 0" }}>
              <Text style={{ margin: 0, fontWeight: 600, color: "#011638" }}>{propertyName}</Text>
              <Text style={{ margin: "4px 0 0", color: "#555", fontSize: 14 }}>{propertyAddress}</Text>
              <Text style={{ margin: "8px 0 0", color: "#555", fontSize: 14 }}>
                Room: <strong style={{ fontFamily: "monospace" }}>{roomCode}</strong>
              </Text>
              <Text style={{ margin: "4px 0 0", color: "#555", fontSize: 14 }}>
                Deposit: <strong>{depositAmount.toFixed(0)} USDC</strong>
              </Text>
            </Section>
            <Button
              href={inviteUrl}
              style={{ backgroundColor: "#011638", color: "#ffffff", borderRadius: 6, padding: "12px 24px", textDecoration: "none", display: "inline-block", fontWeight: 600 }}
            >
              Accept invitation
            </Button>
            <Hr style={{ margin: "32px 0", borderColor: "#e4e4e7" }} />
            <Text style={{ color: "#999", fontSize: 12 }}>
              This invite link expires in 7 days. If you did not expect this email, ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
