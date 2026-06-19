export interface Owner {
  id: string
  name: string
  email: string
  phone?: string | null
  waNumber?: string | null
  telegramChatId?: string | null
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  owner: Owner
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface ApiError {
  success: false
  error: string
  statusCode: number
}
