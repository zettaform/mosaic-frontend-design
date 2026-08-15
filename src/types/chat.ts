export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  error?: boolean
  isThinking?: boolean
  id?: string
}

export interface Conversation {
  conversationId: string
  title: string
  messageCount: number
  updatedAt: string
  createdAt: string
  messages?: Message[]
}

export interface ChatSettings {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  stream: boolean
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface AIModel {
  id: string
  name: string
  description: string
  provider?: string
  category?: string
  contextWindow?: number
  precision?: string
  status?: 'active' | 'inactive'
}

export interface ChatRequest {
  messages: Message[]
  conversationId?: string | null
  model: string
  settings: ChatSettings
}

export interface ChatResponse {
  message?: string
  usage?: TokenUsage
  conversationId?: string
  error?: string
}

export interface StreamingChunk {
  type: 'content' | 'usage' | 'error'
  content?: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  conversationId?: string
  message?: string
}
