export function humanizeEscrowError(message: string): string {
  const map: Record<string, string> = {
    "Only the approver can change milestone flag":
      "Only the landlord can approve this checkout.",
    "Only the service provider can change milestone status":
      "Only the tenant can request a checkout.",
    "Milestone already in dispute": "A dispute is already open on this tenancy.",
    "The milestone must be completed to release funds":
      "The landlord must approve checkout before funds can be released.",
    "Only the release signer can release the escrow funds":
      "Funds can only be released by the Caushun platform.",
    "Only the dispute resolver can execute this function":
      "Disputes can only be resolved by the Caushun platform.",
    "You cannot approve a milestone that has already been approved previously":
      "This checkout has already been approved.",
    "Escrow already initialized": "An escrow already exists for this room.",
    "Amount cannot be zero": "Deposit amount must be greater than zero.",
  }
  return map[message] ?? `Transaction failed: ${message}. Please try again.`
}
