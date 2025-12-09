import { Server as NetServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { NextApiResponse } from 'next'

interface CustomSocket extends Socket {
  userId?: string
  userRole?: string
  userName?: string
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export type NextApiResponseServerIO = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

export const initSocketServer = (res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('🔄 Initializing Socket.IO server...')
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
      },
      transports: ['polling', 'websocket'],
    })

    const connectedUsers = new Map()

    io.on('connection', (socket: CustomSocket) => {
      console.log('✅ Client connected:', socket.id)

      socket.on('join-user', ({ userId, role, name }) => {
        console.log(`👤 User joined: ${name} (${role})`)
        socket.userId = userId
        socket.userRole = role
        socket.userName = name
        
        socket.join(`user-${userId}`)
        socket.join(role)
        
        connectedUsers.set(userId, {
          socketId: socket.id,
          role,
          name,
          online: true
        })
        
        io.emit('user-online', {
          userId,
          role,
          name,
          online: true
        })
      })

      socket.on('send-message', async ({ chatId, message, recipientId, senderId }) => {
        console.log(`💬 New message in chat ${chatId}`)
        
        const fullMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          chatId,
          senderId,
          message,
          timestamp: new Date().toISOString(),
          recipientId
        }
        
        io.to(`user-${recipientId}`).emit('receive-message', fullMessage)
        socket.emit('message-sent', fullMessage)
      })

      socket.on('typing', ({ chatId, userId, name }) => {
        socket.broadcast.to(chatId).emit('user-typing', {
          chatId,
          name
        })
      })

      socket.on('stop-typing', ({ chatId }) => {
        socket.broadcast.to(chatId).emit('user-stop-typing', {
          chatId
        })
      })

      socket.on('mark-read', ({ chatId, messageId, userId }) => {
        io.to(chatId).emit('message-read', {
          chatId,
          messageId,
          userId
        })
      })

      socket.on('order-paid', ({ orderId, userId, vendorId, amount, paymentMethod }) => {
        console.log(`💰 Payment notification: Order ${orderId}`)
        // Notify vendor (emit to vendor role room or specific vendor)
        io.to('vendor').emit('new-order-payment', {
          orderId,
          userId,
          amount,
          paymentMethod,
          timestamp: new Date().toISOString()
        })
        // Also notify specific user's room for acknowledgment
        io.to(`user-${userId}`).emit('payment-confirmed', { orderId })
      })

      socket.on('order-status-updated', ({ orderId, status, vendorId, clientId }) => {
        console.log(`📦 Order status update: Order ${orderId} -> ${status}`)
        // Notify the client to update their orders list
        io.to(`user-${clientId}`).emit('order-status-changed', {
          orderId,
          status,
          timestamp: new Date().toISOString()
        })
        // Also broadcast to vendor room
        io.to('vendor').emit('order-status-changed', {
          orderId,
          status,
          timestamp: new Date().toISOString()
        })
      })

      socket.on('get-online-users', (callback) => {
        const onlineUsers = Array.from(connectedUsers.entries())
          .map(([id, user]) => ({
            id,
            name: user.name,
            role: user.role,
            online: true
          }))
        callback(onlineUsers)
      })

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id)
        for (const [userId, user] of connectedUsers.entries()) {
          if (user.socketId === socket.id) {
            connectedUsers.delete(userId)
            io.emit('user-offline', { 
              userId,
              name: user.name,
              role: user.role,
              online: false
            })
            break
          }
        }
      })
    })

    res.socket.server.io = io
    // Expose globally so other API routes can emit events without access to `res`
    try {
      ;(globalThis as any).__io = io
    } catch (e) {
      console.warn('Unable to set global io instance', e)
    }
  }
  
  return res.socket.server.io
}

export const emitOrderCreated = (order: any) => {
  try {
    const io = (globalThis as any).__io
    if (!io) return
    // Emit to vendor room and the specific user
    io.to('vendor').emit('order-created', order)
    if (order.userId) io.to(`user-${order.userId}`).emit('order-created', order)
  } catch (e) {
    console.error('emitOrderCreated error', e)
  }
}

export const emitOrderUpdated = (order: any) => {
  try {
    const io = (globalThis as any).__io
    if (!io) return
    // Broadcast updated order to vendor room and the specific user
    io.to('vendor').emit('order-updated', order)
    if (order.userId) io.to(`user-${order.userId}`).emit('order-updated', order)
    
    // Also emit specific status change event for clients listening for order-status-changed
    if (order.status) {
      io.to(`user-${order.userId}`).emit('order-status-changed', {
        orderId: order.id || order._id,
        status: order.status,
        timestamp: new Date().toISOString()
      })
    }
  } catch (e) {
    console.error('emitOrderUpdated error', e)
  }
}