const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://127.0.0.1:8000'

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('access_token')

  const headers = new Headers(options.headers)

  headers.set('Content-Type', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = 'Something went wrong.'

    try {
      const data = await response.json()
      message = data.detail ?? message
    } catch {
      // Keep default message.
    }

    throw new Error(message)
  }

  return response.json()
}

export interface User {
  id: string
  name: string
  email: string
  is_active: boolean
  is_admin: boolean
  created_at: string
}

export interface Conversation {
  id: string
  title: string | null
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export async function login(
  email: string,
  password: string,
) {
  return request<{
    access_token: string
    token_type: string
    user: User
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  })
}

export async function register(
  name: string,
  email: string,
  password: string,
) {
  return request<{
    access_token: string
    token_type: string
    user: User
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  })
}

export async function getMe() {
  return request<User>('/auth/me')
}

export async function getConversations() {
  const result = await request<{
    conversations: Conversation[]
  }>('/conversations')

  return result.conversations
}

export async function createConversation(title?: string) {
  return request<Conversation>('/conversations', {
    method: 'POST',
    body: JSON.stringify({
      title: title ?? null,
    }),
  })
}

export async function getMessages(conversationId: string) {
  const result = await request<{
    messages: Message[]
  }>(`/conversations/${conversationId}/messages`)

  return result.messages
}

export async function sendMessage(
  conversationId: string,
  message: string,
) {
  return request<unknown>(`/chat/${conversationId}`, {
    method: 'POST',
    body: JSON.stringify({
      message,
    }),
  })
}

export async function toggleConversationPin(
  conversationId: string,
) {
  return request<Conversation>(
    `/conversations/${conversationId}/pin`,
    {
      method: 'PATCH',
    },
  )
}

export async function renameConversation(
  conversationId: string,
  title: string,
) {
  return request<Conversation>(
    `/conversations/${conversationId}/title`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        title,
      }),
    },
  )
}

export async function deleteConversation(
  conversationId: string,
) {
  return request<{
    message: string
  }>(`/conversations/${conversationId}`, {
    method: 'DELETE',
  })
}

export interface UsageSummary {
  ai_requests: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  users: number
}

export interface UsageByModel {
  provider: string
  model: string
  requests: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

export interface UsageByUser {
  user_id: string
  name: string
  email: string
  requests: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

export interface AdminUsage {
  period: string
  summary: UsageSummary
  by_model: UsageByModel[]
  by_user: UsageByUser[]
}

export async function getAdminUsage() {
  return request<AdminUsage>('/admin/usage')
}