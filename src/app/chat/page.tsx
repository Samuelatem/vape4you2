'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageCircle, Users, Circle, RefreshCw } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { Button } from '@/components/ui/Button'
import { formatDistance } from 'date-fns'

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: 'vendor' | 'client'
  message: string
  timestamp: string
  chatId: string
  recipientId: string
  recipientName: string
  read: boolean
}

interface ChatUser {
  id: string
  name: string
  role: 'vendor' | 'client'
  online: boolean
}

interface ChatSession {
  id: string
  participants: {
    vendorId: string
    vendorName: string
    clientId: string
    clientName: string
  }
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: {
    vendor: number
    client: number
  }
  createdAt: string
}

export default function ChatPage() {
  const { data: session } = useSession()
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const selectedSessionRef = useRef<ChatSession | null>(null)
  const socket = useSocket({
    userId: session?.user?.id,
    userName: session?.user?.name,
    userRole: session?.user?.role as 'vendor' | 'client'
  })

  useEffect(() => {
    selectedSessionRef.current = selectedSession
  }, [selectedSession])

  // Load chat data and set up Socket.IO listeners
  const buildRealtimeMessage = useCallback((
    payload: { id?: string; chatId: string; message: string; senderId: string; recipientId: string; timestamp?: string },
    chatSession: ChatSession
  ): Message | null => {
    if (!session?.user) return null

    const viewerIsVendor = session.user.id === chatSession.participants.vendorId
    const otherName = viewerIsVendor ? chatSession.participants.clientName : chatSession.participants.vendorName
    const otherRole = viewerIsVendor ? 'client' : 'vendor'
    const isCurrentUserSender = payload.senderId === session.user.id

    return {
      id: payload.id || `socket-${Date.now()}`,
      chatId: payload.chatId,
      message: payload.message,
      senderId: payload.senderId,
      senderName: isCurrentUserSender ? (session.user.name || 'You') : otherName,
      senderRole: isCurrentUserSender ? (session.user.role as 'vendor' | 'client') : otherRole,
      recipientId: payload.recipientId,
      recipientName: isCurrentUserSender ? otherName : (session.user.name || ''),
      timestamp: payload.timestamp || new Date().toISOString(),
      read: isCurrentUserSender
    }
  }, [session?.user])

  useEffect(() => {
    if (!session?.user || !socket) return

    setSocketStatus(socket.connected ? 'connected' : 'connecting')
    loadChatData()
    loadAvailableUsers()

    const handleReceiveMessage = (payload: { chatId: string; message: string; senderId: string; recipientId: string; id?: string; timestamp?: string }) => {
      const activeSession = selectedSessionRef.current
      if (activeSession && activeSession.id === payload.chatId) {
        const realtimeMessage = buildRealtimeMessage(payload, activeSession)
        if (realtimeMessage) {
          setMessages(prev => [...prev, realtimeMessage])
          // Scroll to bottom for active chat
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }
      loadChatData()
    }

    const handleTyping = ({ chatId, name }: { chatId: string; name: string }) => {
      if (selectedSessionRef.current?.id === chatId) {
        setTypingUser(name)
      }
    }

    const handleStopTyping = ({ chatId }: { chatId: string }) => {
      if (selectedSessionRef.current?.id === chatId) {
        setTypingUser(null)
      }
    }

    const handleMessageRead = ({ chatId, messageId }: { chatId: string; messageId: string }) => {
      if (selectedSessionRef.current?.id !== chatId) return
      setMessages(prev => prev.map(msg => (msg.id === messageId ? { ...msg, read: true } : msg)))
    }

    const handleConnect = () => setSocketStatus('connected')
    const handleDisconnect = () => setSocketStatus('error')
    const handleConnectError = () => setSocketStatus('error')

    socket.on('receive-message', handleReceiveMessage)
    socket.on('user-typing', handleTyping)
    socket.on('user-stop-typing', handleStopTyping)
    socket.on('message-read', handleMessageRead)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)

    return () => {
      socket.off('receive-message', handleReceiveMessage)
      socket.off('user-typing', handleTyping)
      socket.off('user-stop-typing', handleStopTyping)
      socket.off('message-read', handleMessageRead)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
    }
  }, [session, socket, buildRealtimeMessage])
  
  const loadChatData = async () => {
    try {
      const response = await fetch('/api/chat/sessions')
      const data = await response.json()
      
      if (data.success) {
        setChatSessions(data.sessions)
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
    }
  }
  
  const loadAvailableUsers = async () => {
    try {
      const response = await fetch('/api/chat/users')
      const data = await response.json()
      
      if (data.success) {
        setAvailableUsers(data.users)
      }
    } catch (error) {
      console.error('Error loading available users:', error)
    }
  }
  
  const loadMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`)
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }
  
  const createChatSession = async (recipientId: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSelectedSession(data.session)
        await loadMessages(data.session.id)
        await loadChatData()
      }
    } catch (error) {
      console.error('Error creating chat session:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    
    // Mark messages as read when session changes or new messages arrive
    if (selectedSession && session?.user) {
      const unreadMessages = messages.filter(msg => 
        !msg.read && msg.senderId !== session.user.id
      )
      
      if (unreadMessages.length > 0 && socket) {
        unreadMessages.forEach(msg => {
          socket.emit('mark-read', {
            chatId: selectedSession.id,
            messageId: msg.id,
            userId: session.user.id
          })
        })
      }
    }
  }, [messages, selectedSession, session?.user, socket])

  const sendMessage = async () => {
    if (!message.trim() || !selectedSession || !session?.user || sending || !socket) return

    const recipientId = selectedSession.participants.vendorId === session.user.id 
      ? selectedSession.participants.clientId 
      : selectedSession.participants.vendorId

    try {
      setSending(true)
      const response = await fetch(`/api/chat/sessions/${selectedSession.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: message.trim(),
          recipientId 
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage('')
        // Emit message via Socket.IO
        socket.emit('send-message', {
          chatId: selectedSession.id,
          message: message.trim(),
          senderId: session.user.id,
          recipientId,
          id: data.message?.id,
          timestamp: data.message?.timestamp
        })

        if (data.message) {
          setMessages(prev => [...prev, data.message])
        } else {
          await loadMessages(selectedSession.id)
        }

        await loadChatData() // Refresh session list
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please log in to chat</h2>
          <p className="text-gray-600">You need to be logged in to access the chat feature.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chat</h1>
              <p className="text-gray-600 mt-2">Connect with {session.user.role === 'vendor' ? 'clients' : 'vendors'} in real-time</p>
            </div>
            <div className="flex items-center text-sm">
              <span className={`font-semibold ${
                socketStatus === 'connected'
                  ? 'text-green-600'
                  : socketStatus === 'error'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }`}>
                {socketStatus === 'connected' && 'Live connection'}
                {socketStatus === 'connecting' && 'Connecting…'}
                {socketStatus === 'error' && 'Reconnecting…'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {session.user.role === 'vendor' ? 'Clients' : 'Vendors'}
              </h2>
            </div>
            
            <div className="overflow-y-auto">
              {/* Existing Chat Sessions */}
              {chatSessions.map((chatSession) => {
                const isVendor = session.user.role === 'vendor'
                const otherUser = isVendor 
                  ? { id: chatSession.participants.clientId, name: chatSession.participants.clientName, role: 'client' as const }
                  : { id: chatSession.participants.vendorId, name: chatSession.participants.vendorName, role: 'vendor' as const }
                const unreadCount = isVendor ? chatSession.unreadCount.vendor : chatSession.unreadCount.client
                
                return (
                  <motion.div
                    key={chatSession.id}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                    onClick={() => {
                      setSelectedSession(chatSession)
                      loadMessages(chatSession.id)
                    }}
                    className={`p-4 cursor-pointer border-b border-gray-100 ${
                      selectedSession?.id === chatSession.id ? 'bg-purple-50 border-purple-200' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {otherUser.name.charAt(0).toUpperCase()}
                        </div>
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">{otherUser.name}</h3>
                        <p className="text-xs text-gray-600 capitalize">{otherUser.role}</p>
                        {chatSession.lastMessage && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {chatSession.lastMessage}
                          </p>
                        )}
                      </div>
                      {chatSession.lastMessageTime && (
                        <div className="text-xs text-gray-400">
                          {formatDistance(new Date(chatSession.lastMessageTime), new Date(), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
              
              {/* Available Users to Start New Chats */}
              {availableUsers.length > 0 && (
                <>
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Start New Chat
                    </h4>
                  </div>
                  {availableUsers.filter(user => 
                    !chatSessions.some(session => 
                      session.participants.vendorId === user.id || session.participants.clientId === user.id
                    )
                  ).map((user) => (
                    <motion.div
                      key={user.id}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      onClick={() => createChatSession(user.id)}
                      className="p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-xs text-gray-600 capitalize">{user.role}</p>
                        </div>
                        <div className="text-xs text-blue-600">New</div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
              
              {loading && (
                <div className="p-4 text-center">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm flex flex-col">
            {selectedSession ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center">
                    {(() => {
                      const isVendor = session.user.role === 'vendor'
                      const otherUser = isVendor 
                        ? { name: selectedSession.participants.clientName, role: 'client' }
                        : { name: selectedSession.participants.vendorName, role: 'vendor' }
                      
                      return (
                        <>
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {otherUser.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {otherUser.name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="capitalize mr-2">{otherUser.role}</span>
                              {availableUsers.find(u => u.id === (isVendor ? selectedSession.participants.clientId : selectedSession.participants.vendorId))?.online && (
                                <span className="flex items-center text-green-500">
                                  <Circle className="w-2 h-2 mr-1 fill-current" />
                                  Online
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${msg.senderId === session.user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.senderId === session.user?.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="flex items-center mb-1">
                            <span className="text-xs font-medium opacity-75">
                              {msg.senderName}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.senderId === session.user?.id ? 'text-purple-200' : 'text-gray-500'
                          }`}>
                            {formatDistance(new Date(msg.timestamp), new Date(), { addSuffix: true })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Type your message..."
                      disabled={sending}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                      onChange={(e) => {
                        setMessage(e.target.value)
                        if (socket && selectedSession) {
                          // Clear existing timeout
                          if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current)
                          }
                          // Emit typing status
                          socket.emit('typing', {
                            chatId: selectedSession.id,
                            userId: session?.user?.id,
                            name: session?.user?.name
                          })
                          // Clear typing status after 2 seconds
                          typingTimeoutRef.current = setTimeout(() => {
                            socket.emit('stop-typing', {
                              chatId: selectedSession.id,
                              userId: session?.user?.id
                            })
                          }, 2000)
                        }
                      }}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!message.trim() || sending}
                      className="bg-purple-600 hover:bg-purple-700 px-4 py-2 disabled:opacity-50"
                    >
                      {sending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {typingUser && (
                    <p className="text-sm text-gray-500 mt-2">{typingUser} is typing...</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a chat</h3>
                  <p className="text-gray-600">Choose a {session.user.role === 'vendor' ? 'client' : 'vendor'} to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}