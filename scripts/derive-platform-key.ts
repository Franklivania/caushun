/**
 * Derives the Stellar secret key from the BIP39 mnemonic in PLATFORM_WALLET_RECOVERY_PHRASE.
 * Uses SLIP-0010 ed25519 HD derivation (path m/44'/148'/0') — same as Freighter/Lobstr.
 *
 * Run:  bun scripts/derive-platform-key.ts
 * Then: add PLATFORM_WALLET_SECRET_KEY=<output> to .env.local
 */

import { createHmac, pbkdf2Sync } from "crypto"
import { Keypair } from "@stellar/stellar-sdk"

const phrase = process.env.PLATFORM_WALLET_RECOVERY_PHRASE?.replace(/^"|"$/g, "")
if (!phrase) {
  console.error("Set PLATFORM_WALLET_RECOVERY_PHRASE in your .env.local")
  process.exit(1)
}

// BIP39: mnemonic → 64-byte seed
const seed = pbkdf2Sync(phrase, "mnemonic", 2048, 64, "sha512")

// SLIP-0010 ed25519 master key
function masterKey(seed: Buffer): { key: Buffer; chainCode: Buffer } {
  const I = createHmac("sha512", "ed25519 seed").update(seed).digest()
  return { key: I.subarray(0, 32), chainCode: I.subarray(32) }
}

// Hardened child derivation (SLIP-0010 ed25519 only supports hardened)
function deriveChild(
  parent: { key: Buffer; chainCode: Buffer },
  index: number
): { key: Buffer; chainCode: Buffer } {
  const indexBuf = Buffer.allocUnsafe(4)
  indexBuf.writeUInt32BE(index >>> 0, 0)
  const data = Buffer.concat([Buffer.from([0x00]), parent.key, indexBuf])
  const I = createHmac("sha512", parent.chainCode).update(data).digest()
  return { key: I.subarray(0, 32), chainCode: I.subarray(32) }
}

// Path: m/44'/148'/0'
const HARDENED = 0x80000000
const master = masterKey(seed)
const level1 = deriveChild(master, HARDENED | 44)
const level2 = deriveChild(level1, HARDENED | 148)
const level3 = deriveChild(level2, HARDENED | 0)

const keypair = Keypair.fromRawEd25519Seed(level3.key)
console.log("Public key :", keypair.publicKey())
console.log("Secret key :", keypair.secret())
console.log("")
console.log("Add to .env.local:")
console.log(`PLATFORM_WALLET_SECRET_KEY=${keypair.secret()}`)
