import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components"

interface DisputeRaisedEmailProps {
  roomCode: string
  reason: string
  raisedByName: string
  depositAmount: number
  recipientRole: "tenant" | "landlord" | "admin"
}

export function DisputeRaisedEmail({
  roomCode,
  reason,
  raisedByName,
  depositAmount,
  recipientRole,
}: DisputeRaisedEmailProps) {
  const intro =
    recipientRole === "admin"
      ? `A dispute has been raised for room ${roomCode} and requires platform review.`
      : recipientRole === "tenant"
      ? `Your dispute for room ${roomCode} has been received and is under review.`
      : `${raisedByName} has raised a dispute for room ${roomCode}.`

  return (
    <Html>
      <Head />
      <Preview>Dispute raised — room {roomCode}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 8, overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#dc2626", padding: "32px 40px" }}>
            <Heading style={{ color: "#ffffff", fontSize: 24, margin: 0 }}>Caushun</Heading>
            <Text style={{ color: "#fecaca", margin: "8px 0 0" }}>Dispute notification</Text>
          </Section>
          <Section style={{ padding: "32px 40px" }}>
            <Heading style={{ fontSize: 20, color: "#0d0d0d", marginTop: 0 }}>
              Dispute raised
            </Heading>
            <Text style={{ color: "#555", lineHeight: 1.6 }}>{intro}</Text>
            <Section style={{ backgroundColor: "#fef2f2", borderRadius: 6, padding: "16px 20px", margin: "16px 0", borderLeft: "4px solid #dc2626" }}>
              <Text style={{ margin: 0, fontWeight: 600, color: "#991b1b", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
                Reason
              </Text>
              <Text style={{ margin: "8px 0 0", color: "#555", lineHeight: 1.6 }}>
                {reason}
              </Text>
            </Section>
            <Text style={{ color: "#555", fontSize: 14 }}>
              Room: <strong style={{ fontFamily: "monospace" }}>{roomCode}</strong> ·{" "}
              Deposit at stake: <strong>{depositAmount.toFixed(0)} USDC</strong>
            </Text>
            <Hr style={{ margin: "32px 0", borderColor: "#e4e4e7" }} />
            <Text style={{ color: "#999", fontSize: 12 }}>
              The Caushun platform will review the evidence and resolve this dispute. Both parties
              will be notified of the outcome.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
