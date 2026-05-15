import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components"

interface CheckoutRequestedEmailProps {
  roomCode: string
  tenantName: string
  depositAmount: number
  dashboardUrl: string
}

export function CheckoutRequestedEmail({
  roomCode,
  tenantName,
  depositAmount,
  dashboardUrl,
}: CheckoutRequestedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{tenantName} has requested checkout for room {roomCode}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 8, overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#011638", padding: "32px 40px" }}>
            <Heading style={{ color: "#ffffff", fontSize: 24, margin: 0 }}>Caushun</Heading>
          </Section>
          <Section style={{ padding: "32px 40px" }}>
            <Heading style={{ fontSize: 20, color: "#0d0d0d", marginTop: 0 }}>
              Checkout requested
            </Heading>
            <Text style={{ color: "#555", lineHeight: 1.6 }}>
              <strong>{tenantName}</strong> has requested checkout for room{" "}
              <strong style={{ fontFamily: "monospace" }}>{roomCode}</strong>. The{" "}
              {depositAmount.toFixed(0)} USDC deposit is awaiting your approval.
            </Text>
            <Text style={{ color: "#555", lineHeight: 1.6 }}>
              Review the move-out photos and approve or raise a dispute from your dashboard.
            </Text>
            <Button
              href={dashboardUrl}
              style={{ backgroundColor: "#011638", color: "#ffffff", borderRadius: 6, padding: "12px 24px", textDecoration: "none", display: "inline-block", fontWeight: 600 }}
            >
              Review checkout
            </Button>
            <Hr style={{ margin: "32px 0", borderColor: "#e4e4e7" }} />
            <Text style={{ color: "#999", fontSize: 12 }}>
              Approving checkout will release the full deposit to the tenant. Disputing will
              escalate to the Caushun platform for resolution.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
