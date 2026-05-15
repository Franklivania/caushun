export interface TrustlinePayload {
  address: string
  symbol: string
}

export interface EscrowRoles {
  approver: string
  serviceProvider: string
  platformAddress: string
  releaseSigner: string
  disputeResolver: string
  receiver: string
}

export interface MilestoneInput {
  description: string
}

export interface MilestoneState {
  description: string
  status: string
  approved: boolean
  evidence: string
}

export interface EscrowFlags {
  disputed: boolean
  released: boolean
  resolved: boolean
}

export interface DeploySingleReleasePayload {
  signer: string
  engagementId: string
  title: string
  description: string
  roles: EscrowRoles
  amount: number
  platformFee: number
  milestones: MilestoneInput[]
  trustline: TrustlinePayload
}

export interface FundEscrowPayload {
  contractId: string
  signer: string
  amount: number
}

export interface ChangeMilestoneStatusPayload {
  contractId: string
  milestoneIndex: string
  newEvidence: string
  newStatus: string
  serviceProvider: string
}

export interface ApproveMilestonePayload {
  contractId: string
  milestoneIndex: string
  approver: string
}

export interface DisputeEscrowPayload {
  contractId: string
  milestoneIndex: string
  signer: string
}

export interface ReleaseFundsPayload {
  contractId: string
  releaseSigner: string
}

export interface Distribution {
  address: string
  amount: number
}

export interface ResolveDisputePayload {
  contractId: string
  disputeResolver: string
  milestoneIndex: string
  distributions: Distribution[]
}

export interface SetTrustlinePayload {
  signer: string
  trustline: TrustlinePayload
}

export interface UnsignedTxResponse {
  status?: "SUCCESS" | "FAILED"
  unsignedTransaction: string
}

export interface SendTransactionResponse {
  status: "SUCCESS" | "FAILED"
  message: string
  contractId: string
  escrow: EscrowState
}

export interface EscrowState {
  amount: number
  roles: EscrowRoles
  flags: EscrowFlags
  description: string
  engagementId: string
  milestones: MilestoneState[]
  platformFee: number
  title: string
  trustline: TrustlinePayload
}
