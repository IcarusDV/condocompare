import { api } from '@/lib/api'

export interface ChatConversation {
  id: string
  titulo: string | null
  contextType: string
  condominioId: string | null
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface ChatMessageRecord {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources: string | null
  createdAt: string
}

export const chatHistoryService = {
  async listConversations(): Promise<ChatConversation[]> {
    const response = await api.get<ChatConversation[]>('/chat/conversations')
    return response.data
  },

  async createConversation(data: {
    titulo?: string
    contextType?: string
    condominioId?: string
  }): Promise<ChatConversation> {
    const response = await api.post<ChatConversation>('/chat/conversations', data)
    return response.data
  },

  async getMessages(conversationId: string): Promise<ChatMessageRecord[]> {
    const response = await api.get<ChatMessageRecord[]>(`/chat/conversations/${conversationId}/messages`)
    return response.data
  },

  async addMessage(conversationId: string, data: {
    role: string
    content: string
    sources?: string
  }): Promise<ChatMessageRecord> {
    const response = await api.post<ChatMessageRecord>(`/chat/conversations/${conversationId}/messages`, data)
    return response.data
  },

  async updateTitle(conversationId: string, titulo: string): Promise<void> {
    await api.put(`/chat/conversations/${conversationId}`, { titulo })
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/chat/conversations/${conversationId}`)
  },
}
