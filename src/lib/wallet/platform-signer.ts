import { Keypair, Networks, TransactionBuilder } from "@stellar/stellar-sdk"

export function signWithPlatformWallet(unsignedXdr: string): string {
  const secret = process.env.PLATFORM_WALLET_SECRET_KEY
  if (!secret) throw new Error("PLATFORM_WALLET_SECRET_KEY not set")
  const keypair = Keypair.fromSecret(secret)
  const tx = TransactionBuilder.fromXDR(unsignedXdr, Networks.TESTNET)
  tx.sign(keypair)
  return tx.toXDR()
}
