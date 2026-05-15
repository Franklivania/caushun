const TW_BASE = process.env.NEXT_PUBLIC_TW_API_BASE ?? "https://dev.api.trustlesswork.com"

export interface TwFetchOptions {
  method: "GET" | "POST" | "PUT"
  body?: unknown
  params?: Record<string, string>
}

export async function twFetch<T>(
  endpoint: string,
  options: TwFetchOptions
): Promise<T> {
  const apiKey = process.env.TW_API_KEY
  if (!apiKey) throw new Error("TW_API_KEY is not set")

  const url = buildUrl(`${TW_BASE}${endpoint}`, options.params)

  const res = await fetch(url, {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const err = await readTwError(res)
    throw new Error(err)
  }

  return res.json() as Promise<T>
}

export async function twPublicFetch<T>(
  endpoint: string,
  options: TwFetchOptions
): Promise<T> {
  const url = buildUrl(`${TW_BASE}${endpoint}`, options.params)

  const res = await fetch(url, {
    method: options.method,
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const err = await readTwError(res)
    throw new Error(err)
  }

  return res.json() as Promise<T>
}

function buildUrl(base: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return base
  return `${base}?${new URLSearchParams(params).toString()}`
}

async function readTwError(res: Response): Promise<string> {
  const fallback = `TW API error ${res.status}`
  const err = await res.json().catch(() => ({ message: fallback }))
  console.error("[TW API error]", res.status, res.url, JSON.stringify(err))
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof err.message === "string"
  ) {
    const detail =
      "errors" in err ? ` — ${JSON.stringify(err.errors)}` : ""
    return `${err.message}${detail}`
  }
  return fallback
}
