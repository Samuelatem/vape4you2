import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  userId?: string
  userName?: string
  userRole?: 'vendor' | 'client'
}

export const useSocket = ({ userId, userName, userRole }: UseSocketOptions) => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!userId || !userName || !userRole) return

    const resolveBaseUrl = () => {
      if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin
      }
      if (process.env.NEXT_PUBLIC_SOCKET_URL) {
        return process.env.NEXT_PUBLIC_SOCKET_URL
      }
      if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL
      }
      return 'https://vape4you-com.onrender.com'
    }

    const base = resolveBaseUrl()
    const socket = io(base, {
      path: '/api/socketio',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      addTrailingSlash: false,
    })

    console.info('[socket] connecting to', base)

    socketRef.current = socket

    // Join user room when connected
    socket.on('connect', () => {
      console.log('🔗 Connected to chat server')
      socket.emit('join-user', { userId, role: userRole, name: userName })
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    socket.on('error', (error) => {
      console.error('Socket general error:', error)
    })

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId, userName, userRole])

  return socketRef.current
}