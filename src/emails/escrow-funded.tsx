import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components"

interface EscrowFundedEmailProps {
  roomCode: string
  tenantName: string
  depositAmount: number
  contractId: string
  escrowViewerUrl: string
}

export function EscrowFundedEmail({
  roomCode,
  tenantName,
  depositAmount,
  contractId,
  escrowViewerUrl,
}: EscrowFundedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Deposit funded — room {roomCode}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 8, overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#011638", padding: "32px 40px" }}>
            <Heading style={{ color: "#ffffff", fontSize: 24, margin: 0 }}>Caushun</Heading>
          </Section>
          <Section style={{ padding: "32px 40px" }}>
            <Heading style={{ fontSize: 20, color: "#0d0d0d", marginTop: 0 }}>
              Deposit funded ✓
            </Heading>
            <Text style={{ color: "#555", lineHeight: 1.6 }}>
              <strong>{tenantName}</strong> has funded the security deposit for room{" "}
              <strong style={{ fontFamily: "monospace" }}>{roomCode}</strong>.
            </Text>
            <Section style={{ backgroundColor: "#DFF8EB", borderRadius: 6, padding: "16px 20px", margin: "16px 0" }}>
              <Text style={{ margin: 0, color: "#214E34", fontWeight: 600, fontSize: 24 }}>
                {depositAmount.toFixed(0)} USDC
              </Text>
              <Text style={{ margin: "4px 0 0", color: "#214E34", fontSize: 14 }}>
                Now held in escrow
              </Text>
            </Section>
            <Text style={{ color: "#555", fontSize: 14 }}>
              Contract ID:{" "}
              <a href={`${escrowViewerUrl}/${contractId}`} style={{ color: "#011638" }}>
                {contractId.slice(0, 12)}…
              </a>
            </Text>
            <Hr style={{ margin: "32px 0", borderColor: "#e4e4e7" }} />
            <Text style={{ color: "#999", fontSize: 12 }}>
              Funds are secured on-chain and will be released when checkout is approved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
