const HORIZON_TESTNET = "https://horizon-testnet.stellar.org"

interface HorizonBalance {
  asset_type: string
  asset_code?: string
  asset_issuer?: string
}

export async function hasUsdcTrustline(address: string): Promise<boolean> {
  const issuer =
    process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET ??
    "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
  try {
    const res = await fetch(`${HORIZON_TESTNET}/accounts/${address}`)
    if (!res.ok) return false
    const account = (await res.json()) as { balances: HorizonBalance[] }
    return account.balances.some(
      (b) => b.asset_code === "USDC" && b.asset_issuer === issuer
    )
  } catch {
    return false
  }
}
