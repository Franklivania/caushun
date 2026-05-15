"use client"

type WalletKit = typeof import("@creit.tech/stellar-wallets-kit").StellarWalletsKit

let kitPromise: Promise<WalletKit> | null = null

export async function getWalletKit(): Promise<WalletKit> {
  kitPromise ??= Promise.all([
    import("@creit.tech/stellar-wallets-kit"),
    import("@creit.tech/stellar-wallets-kit/modules/freighter"),
    import("@creit.tech/stellar-wallets-kit/modules/albedo"),
  ]).then(([walletsKit, freighter, albedo]) => {
    walletsKit.StellarWalletsKit.init({
      network: walletsKit.Networks.TESTNET,
      selectedWalletId: freighter.FREIGHTER_ID,
      modules: [new freighter.FreighterModule(), new albedo.AlbedoModule()],
    })

    return walletsKit.StellarWalletsKit
  })

  return kitPromise
}

export async function signTransaction({
  unsignedTransaction,
  address,
}: {
  unsignedTransaction: string
  address: string
}): Promise<string> {
  const [{ Networks }, kit] = await Promise.all([
    import("@creit.tech/stellar-wallets-kit"),
    getWalletKit(),
  ])
  // Ensure site has Freighter permission before signing.
  // If already authorized this resolves immediately (no extra popup).
  // If not, this shows the access request so Confirm is no longer greyed out.
  await kit.getAddress()
  const { signedTxXdr } = await kit.signTransaction(unsignedTransaction, {
    address,
    networkPassphrase: Networks.TESTNET,
  })
  return signedTxXdr
}
