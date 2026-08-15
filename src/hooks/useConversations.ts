import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { Conversation } from '@/types/chat'

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/chat/conversations')
      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.status}`)
      }
      
      const data = await response.json()
      const sorted = (data.conversations || []).sort(
        (a: Conversation, b: Conversation) =>
          new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf()
      )
      setConversations(sorted)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations'
      setError(errorMessage)
      console.error('Failed to load conversations:', err)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const loadConversation = useCallback(async (conversationId: string): Promise<Conversation | null> => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`)
      if (!response.ok) {
        throw new Error(`Failed to load conversation: ${response.status}`)
      }
      
      const conversation = await response.json()
      return conversation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation'
      console.error('Failed to load conversation:', err)
      toast.error(errorMessage)
      return null
    }
  }, [toast])

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.status}`)
      }
      
      setConversations(prev => prev.filter(conv => conv.conversationId !== conversationId))
      toast.success('Conversation deleted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation'
      console.error('Failed to delete conversation:', err)
      toast.error(errorMessage)
    }
  }, [toast])

  const createConversation = useCallback(async (title: string): Promise<Conversation | null> => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`)
      }
      
      const conversation = await response.json()
      setConversations(prev => [conversation, ...prev])
      toast.success('Conversation created successfully')
      return conversation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation'
      console.error('Failed to create conversation:', err)
      toast.error(errorMessage)
      return null
    }
  }, [toast])

  const updateConversation = useCallback(async (conversationId: string, updates: Partial<Conversation>) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update conversation: ${response.status}`)
      }
      
      const updatedConversation = await response.json()
      setConversations(prev =>
        prev.map(conv =>
          conv.conversationId === conversationId ? updatedConversation : conv
        )
      )
      return updatedConversation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update conversation'
      console.error('Failed to update conversation:', err)
      toast.error(errorMessage)
      return null
    }
  }, [toast])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return {
    conversations,
    isLoading,
    error,
    loadConversations,
    loadConversation,
    deleteConversation,
    createConversation,
    updateConversation,
  }
}
