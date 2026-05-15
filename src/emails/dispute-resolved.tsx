import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components"

interface DisputeResolvedEmailProps {
  roomCode: string
  tenantAmount: number
  landlordAmount: number
  recipientRole: "tenant" | "landlord"
}

export function DisputeResolvedEmail({
  roomCode,
  tenantAmount,
  landlordAmount,
  recipientRole,
}: DisputeResolvedEmailProps) {
  const recipientAmount = recipientRole === "tenant" ? tenantAmount : landlordAmount
  const label = recipientRole === "tenant" ? "refund" : "claim"

  return (
    <Html>
      <Head />
      <Preview>Dispute resolved — room {roomCode}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 8, overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#011638", padding: "32px 40px" }}>
            <Heading style={{ color: "#ffffff", fontSize: 24, margin: 0 }}>Caushun</Heading>
          </Section>
          <Section style={{ padding: "32px 40px" }}>
            <Heading style={{ fontSize: 20, color: "#0d0d0d", marginTop: 0 }}>
              Dispute resolved ✓
            </Heading>
            <Text style={{ color: "#555", lineHeight: 1.6 }}>
              The platform has reviewed the dispute for room{" "}
              <strong style={{ fontFamily: "monospace" }}>{roomCode}</strong> and issued a
              resolution.
            </Text>
            <Section style={{ backgroundColor: "#DFF8EB", borderRadius: 6, padding: "16px 20px", margin: "16px 0" }}>
              <Text style={{ margin: 0, color: "#214E34", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                Your {label}
              </Text>
              <Text style={{ margin: "8px 0 0", color: "#214E34", fontWeight: 700, fontSize: 28 }}>
                {recipientAmount.toFixed(2)} USDC
              </Text>
            </Section>
            <Text style={{ color: "#555", fontSize: 14 }}>
              Breakdown: tenant receives <strong>{tenantAmount.toFixed(2)} USDC</strong>,
              landlord receives <strong>{landlordAmount.toFixed(2)} USDC</strong>.
              Funds have been released on-chain.
            </Text>
            <Hr style={{ margin: "32px 0", borderColor: "#e4e4e7" }} />
            <Text style={{ color: "#999", fontSize: 12 }}>
              This resolution is final. Contact support if you believe there has been an error.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
