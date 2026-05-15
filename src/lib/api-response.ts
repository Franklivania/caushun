export type ApiStatus = "success" | "error"

export interface ApiResponse<T> {
  status: ApiStatus
  data: T
  message: string
}

export function ok<T>(data: T, message = "OK"): ApiResponse<T> {
  return { status: "success", data, message }
}

export function fail<T = null>(
  message: string,
  data: T = null as T
): ApiResponse<T> {
  return { status: "error", data, message }
}
