import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { Message, ChatSettings, TokenUsage } from '@/types/chat'

interface UseChatOptions {
  initialMessages?: Message[]
  initialSettings?: ChatSettings
  onError?: (error: Error) => void
}

export const useChat = (options: UseChatOptions = {}) => {
  const { initialMessages = [], initialSettings, onError } = options
  const toast = useToast()
  
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  })
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const [settings, setSettings] = useState<ChatSettings>(
    initialSettings || {
      temperature: 0.7,
      maxTokens: 4000,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      stream: true,
    }
  )

  const sendMessage = useCallback(
    async (
      content: string,
      model: string,
      onStream?: (chunk: string) => void
    ) => {
      if (!content.trim() || isLoading) return

      const userMessage: Message = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9),
      }

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setIsLoading(true)

      // Add thinking message
      const thinkingMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isThinking: true,
        id: Math.random().toString(36).substr(2, 9),
      }
      setMessages(prev => [...prev, thinkingMessage])

      try {
        abortControllerRef.current = new AbortController()
        
        // Resolve API base: use Vite proxy on port 5174, otherwise use VITE_API_URL or same origin
        const isDev = typeof window !== 'undefined' && window.location && window.location.port === '5174'
        const isDevMode = (import.meta as any)?.env?.DEV === true
        const useProxy = (import.meta as any)?.env?.VITE_USE_PROXY === 'true' || isDev
        const base = useProxy
          ? ''
          : (((import.meta as any)?.env?.VITE_API_URL) || (typeof window !== 'undefined' ? window.location.origin : (isDevMode ? '' : '')))
              .toString()
              .replace(/\/$/, '')

        const response = await fetch(`${base}/api/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages,
            conversationId,
            model,
            settings,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        if (settings.stream) {
          await handleStreamingResponse(response, onStream)
        } else {
          await handleNonStreamingResponse(response)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return // Request was aborted
        }
        
        console.error('Chat error:', error)
        const errorMessage: Message = {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          timestamp: new Date().toISOString(),
          error: true,
          id: Math.random().toString(36).substr(2, 9),
        }
        setMessages(prev => [...prev, errorMessage])
        
        onError?.(error as Error)
        toast.error('Failed to send message. Please try again.')
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [messages, conversationId, settings, isLoading, toast, onError]
  )

  const handleStreamingResponse = async (
    response: Response,
    onStream?: (chunk: string) => void
  ) => {
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isThinking: false,
      id: Math.random().toString(36).substr(2, 9),
    }

    let hasStarted = false

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6))
            
            if (data.type === 'content') {
              const piece = data.content
              
              if (!hasStarted && /\S/.test(piece)) {
                assistantMessage.content = piece.replace(/^\s+/, '')
                hasStarted = true
              } else if (hasStarted) {
                assistantMessage.content += piece
              }
              
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { ...assistantMessage }
                return updated
              })
              
              onStream?.(piece)
            } else if (data.type === 'usage') {
              setTokenUsage({
                inputTokens: data.inputTokens || 0,
                outputTokens: data.outputTokens || 0,
                totalTokens: data.totalTokens || 0,
              })
              if (data.conversationId) {
                setConversationId(data.conversationId)
              }
            } else if (data.type === 'error') {
              throw new Error(data.message)
            }
          } catch (parseError) {
            console.warn('Failed to parse streaming chunk:', parseError)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    // Final update
    setMessages(prev => {
      const updated = [...prev]
      updated[updated.length - 1] = { ...assistantMessage }
      return updated
    })
  }

  const handleNonStreamingResponse = async (response: Response) => {
    const data = await response.json()
    
    const assistantMessage: Message = {
      role: 'assistant',
      content: data.message?.replace(/^\s+/, '') || 'No response received',
      timestamp: new Date().toISOString(),
      isThinking: false,
      id: Math.random().toString(36).substr(2, 9),
    }

    setMessages(prev => {
      const updated = [...prev]
      updated[updated.length - 1] = assistantMessage
      return updated
    })

    if (data.usage) {
      setTokenUsage({
        inputTokens: data.usage.inputTokens || 0,
        outputTokens: data.usage.outputTokens || 0,
        totalTokens: data.usage.totalTokens || 0,
      })
    }
    
    if (data.conversationId) {
      setConversationId(data.conversationId)
    }
  }

  const clearMessages = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setTokenUsage({ inputTokens: 0, outputTokens: 0, totalTokens: 0 })
  }, [])

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const updateSettings = useCallback((newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  return {
    messages,
    setMessages,
    isLoading,
    conversationId,
    setConversationId,
    tokenUsage,
    settings,
    updateSettings,
    sendMessage,
    clearMessages,
    stopGeneration,
  }
}
