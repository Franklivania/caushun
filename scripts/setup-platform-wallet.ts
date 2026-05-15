/**
 * Sets the USDC trustline on the platform wallet.
 * Run once before deploying any escrows: bun run scripts/setup-platform-wallet.ts
 *
 * Requires PLATFORM_WALLET_PUBLIC_KEY, PLATFORM_WALLET_SECRET_KEY,
 * and NEXT_PUBLIC_USDC_ISSUER_TESTNET in .env.local
 */
import { loadEnvConfig } from "@next/env"
import {
  Keypair,
  Asset,
  TransactionBuilder,
  Networks,
  Operation,
  Horizon,
} from "@stellar/stellar-sdk"

loadEnvConfig(process.cwd())

const secretKey = process.env.PLATFORM_WALLET_SECRET_KEY
const publicKey = process.env.PLATFORM_WALLET_PUBLIC_KEY
const usdcIssuer =
  process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET ??
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"

if (!secretKey) throw new Error("PLATFORM_WALLET_SECRET_KEY is not set")
if (!publicKey) throw new Error("PLATFORM_WALLET_PUBLIC_KEY is not set")

const server = new Horizon.Server("https://horizon-testnet.stellar.org")

// 1. Check XLM balance (account must be funded first)
console.log(`Platform wallet: ${publicKey}`)
let account
try {
  account = await server.loadAccount(publicKey)
} catch {
  console.error(
    "\nAccount not found on testnet. Fund it first via Friendbot:\n" +
    `  https://friendbot.stellar.org/?addr=${publicKey}\n` +
    "Then re-run this script."
  )
  process.exit(1)
}

const xlmBalance = account.balances.find((b) => b.asset_type === "native")
console.log(`XLM balance: ${xlmBalance?.balance ?? "0"}`)

// 2. Check if USDC trustline already exists
const usdcBalance = account.balances.find(
  (b) =>
    b.asset_type === "credit_alphanum4" &&
    "asset_code" in b && b.asset_code === "USDC" &&
    "asset_issuer" in b && b.asset_issuer === usdcIssuer
)

if (usdcBalance) {
  console.log("✓ USDC trustline already set — nothing to do.")
  process.exit(0)
}

// 3. Build and sign the change_trust transaction
const keypair = Keypair.fromSecret(secretKey)
const usdc = new Asset("USDC", usdcIssuer)

const tx = new TransactionBuilder(account, {
  fee: "100",
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(Operation.changeTrust({ asset: usdc }))
  .setTimeout(30)
  .build()

tx.sign(keypair)

// 4. Submit
console.log("Submitting change_trust transaction…")
const result = await server.submitTransaction(tx)
console.log(`✓ USDC trustline set. Tx hash: ${result.hash}`)
