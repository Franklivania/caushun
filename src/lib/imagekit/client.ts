const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? ""

export function ikUrl(path: string, width?: number, height?: number): string {
  if (!width && !height) return `${urlEndpoint}${path}`

  const transforms: string[] = []
  if (width) transforms.push(`w-${width}`)
  if (height) transforms.push(`h-${height}`)

  return `${urlEndpoint}/tr:${transforms.join(",")},fo-auto${path}`
}

export function ikThumb(url: string): string {
  if (!urlEndpoint || !url.startsWith(urlEndpoint)) return url
  return url.replace(urlEndpoint, `${urlEndpoint}/tr:w-400,h-300,fo-auto,q-80`)
}
