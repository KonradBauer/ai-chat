export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export type ChatStatus =
  | { type: 'idle' }
  | { type: 'streaming'; messageId: string }
  | { type: 'error'; error: string; messageId: string }
