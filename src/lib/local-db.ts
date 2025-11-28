import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { IChatMessage as ChatMessage, IChatSession as ChatSession } from '@/models/Chat'

const DB_FILE = path.join(process.cwd(), 'local-db.json')

interface LocalOrder {
  id: string
  userId: string
  items: {
    productId: string
    productName: string
    quantity: number
    price: number
  }[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: string
  paymentStatus: 'pending' | 'completed' | 'failed'
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    city: string
    postalCode: string
    country: string
    email?: string
  }
  trackingNumber?: string
  createdAt: string
  updatedAt: string
  bitcoinPayment?: {
    orderId: string
    address: string
    amount: string
    amountUSD: number
    status: 'pending' | 'confirmed' | 'failed'
    expiresAt: Date
    qrCode: string
    instructions: string[]
  }
}

interface LocalUser {
  id: string
  email: string
  password: string
  name: string
  role: 'vendor' | 'client'
  createdAt: string
}

interface LocalProduct {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  vendorId: string
  vendorName: string
  rating: number
  reviews: number
  inStock: boolean
  specifications: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface LocalDB {
  users: LocalUser[]
  products: LocalProduct[]
  chatMessages: ChatMessage[]
  chatSessions: ChatSession[]
  orders: LocalOrder[]
}

// Initialize local database
function initLocalDB(): LocalDB {
  if (!fs.existsSync(DB_FILE)) {
    const initialDB: LocalDB = {
      users: [],
      products: [],
      chatMessages: [],
      chatSessions: [],
      orders: []
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2))
    return initialDB
  }
  
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading local DB:', error)
    return { users: [], products: [], chatMessages: [], chatSessions: [], orders: [] }
  }
}

function saveLocalDB(db: LocalDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
  } catch (error) {
    console.error('Error saving local DB:', error)
  }
}

export class LocalDatabase {
  private db: LocalDB

  constructor() {
    this.db = initLocalDB()
    if (!this.db.chatMessages) this.db.chatMessages = []
    if (!this.db.chatSessions) this.db.chatSessions = []
    if (!this.db.orders) this.db.orders = []
  }

  // User methods
  async createUser(userData: { email: string; password: string; name: string; role: 'vendor' | 'client' }) {
    // Check if user exists
    const existingUser = this.db.users.find(u => u.email === userData.email)
    if (existingUser) {
      throw new Error('User already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Create user
    const newUser: LocalUser = {
      id: new mongoose.Types.ObjectId().toString(),
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      role: userData.role,
      createdAt: new Date().toISOString()
    }

    this.db.users.push(newUser)
    saveLocalDB(this.db)

    // Return user without password
    const { password, ...userWithoutPassword } = newUser
    return userWithoutPassword
  }

  async findUserByEmail(email: string) {
    return this.db.users.find(u => u.email === email) || null
  }

  async validatePassword(email: string, password: string) {
    const user = await this.findUserByEmail(email)
    if (!user) return null

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return null

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async getUserCount() {
    return this.db.users.length
  }

  // Product methods
  async getProducts(options: {
    page?: number
    limit?: number
    category?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    let products = [...this.db.products]
    
    // Filter by category
    if (options.category) {
      products = products.filter(p => p.category === options.category)
    }
    
    // Filter by search
    if (options.search) {
      const searchLower = options.search.toLowerCase()
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      )
    }
    
    // Sort
    const sortBy = options.sortBy || 'createdAt'
    const sortOrder = options.sortOrder || 'desc'
    
    products.sort((a, b) => {
      const aVal = (a as any)[sortBy]
      const bVal = (b as any)[sortBy]
      
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : 1
      } else {
        return aVal < bVal ? -1 : 1
      }
    })
    
    // Pagination
    const page = options.page || 1
    const limit = options.limit || 12
    const skip = (page - 1) * limit
    const paginatedProducts = products.slice(skip, skip + limit)
    
    return {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: products.length,
        pages: Math.ceil(products.length / limit)
      }
    }
  }

  async getProductsByVendor(vendorId: string) {
    if (!vendorId) return []

    // Return a shallow copy so callers cannot mutate internal state
    return this.db.products
      .filter(product => product.vendorId === vendorId)
      .map(product => ({ ...product }))
  }

  async addProduct(productData: any) {
    const newProduct = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...productData,
      rating: productData.rating || 0,
      reviews: productData.reviews || [],
      inStock: productData.inStock !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.db.products.push(newProduct)
    saveLocalDB(this.db)
    return newProduct
  }

  async getProduct(id: string) {
    return this.db.products.find(p => p.id === id)
  }

  async updateProduct(id: string, updates: any) {
    const productIndex = this.db.products.findIndex(p => p.id === id)
    if (productIndex === -1) return null
    
    this.db.products[productIndex] = {
      ...this.db.products[productIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    saveLocalDB(this.db)
    return this.db.products[productIndex]
  }

  async deleteProduct(id: string) {
    const productIndex = this.db.products.findIndex(p => p.id === id)
    if (productIndex === -1) return false
    
    this.db.products.splice(productIndex, 1)
    saveLocalDB(this.db)
    return true
  }

  async seedDemoProducts() {
    if (this.db.products.length > 0) {
      console.log('Products already exist, skipping seed')
      return
    }

    // Find vendor user
    const vendor = this.db.users.find(u => u.role === 'vendor')
    if (!vendor) {
      console.log('No vendor found, cannot seed products')
      return
    }

    const demoProducts = [
      // Vape Pens
      { name: 'Premium Vape Pen V1', description: 'High-quality vape pen with premium features and long battery life', price: 7, images: ['/images/products/1.jpg'], category: 'vape-pens', rating: 4.5, reviews: 24, inStock: true },
      { name: 'Sleek Vape Pen Pro', description: 'Ultra-slim design with powerful performance', price: 7, images: ['/images/products/2.jpg'], category: 'vape-pens', rating: 4.3, reviews: 31, inStock: true },
      { name: 'Executive Vape Pen', description: 'Professional grade pen for business use', price: 8, images: ['/images/products/3.jpg'], category: 'vape-pens', rating: 4.7, reviews: 18, inStock: true },
      
      // Mods
      { name: 'Cloud Master Pro', description: 'Professional grade vaping device with advanced temperature control', price: 8, images: ['/images/products/4.jpg'], category: 'mod', rating: 4.8, reviews: 42, inStock: true },
      { name: 'Thunder Mod 200W', description: 'High-power mod with dual battery support', price: 8, images: ['/images/products/5.jpg'], category: 'mod', rating: 4.6, reviews: 28, inStock: true },
      { name: 'Stealth Mod Mini', description: 'Compact mod with premium build quality', price: 8, images: ['/images/products/6.jpg'], category: 'mod', rating: 4.4, reviews: 33, inStock: true },
      { name: 'Titan Mod Elite', description: 'Heavy-duty mod for serious vapers', price: 8, images: ['/images/products/7.jpg'], category: 'mod', rating: 4.9, reviews: 15, inStock: true },
      
      // Starter Kits
      { name: 'Beginner Kit Essential', description: 'Perfect starter kit for new vapers', price: 5, images: ['/images/products/8.jpg'], category: 'starter-kits', rating: 4.2, reviews: 67, inStock: true },
      { name: 'Complete Starter Pack', description: 'Everything you need to start vaping', price: 5, images: ['/images/products/9.jpg'], category: 'starter-kits', rating: 4.1, reviews: 89, inStock: true },
      { name: 'Premium Starter Kit', description: 'High-end starter kit with premium accessories', price: 5, images: ['/images/products/10.jpg'], category: 'starter-kits', rating: 4.5, reviews: 21, inStock: true },
      
      // Disposables
      { name: 'Mango Blast Disposable', description: 'Tropical mango flavor disposable vape', price: 5, images: ['/images/products/11.jpg'], category: 'disposable', rating: 4.0, reviews: 156, inStock: true },
      { name: 'Mint Fresh Disposable', description: 'Cool mint flavor for refreshing experience', price: 8, images: ['/images/products/12.jpg'], category: 'disposable', rating: 4.2, reviews: 134, inStock: true },
      { name: 'Berry Mix Disposable', description: 'Mixed berry flavor disposable', price: 8, images: ['/images/products/13.jpg'], category: 'disposable', rating: 3.9, reviews: 98, inStock: true },
      { name: 'Vanilla Dream Disposable', description: 'Smooth vanilla flavor disposable', price: 8, images: ['/images/products/14.jpg'], category: 'disposable', rating: 4.1, reviews: 76, inStock: true },
      
      // Pod Systems
      { name: 'Pod System Elite', description: 'Sleek pod system with refillable cartridges', price: 6, images: ['/images/products/15.jpg'], category: 'pod-system', rating: 4.6, reviews: 45, inStock: true },
      { name: 'Compact Pod Pro', description: 'Ultra-portable pod system', price: 6, images: ['/images/products/16.jpg'], category: 'pod-system', rating: 4.4, reviews: 38, inStock: true },
      { name: 'Smart Pod System', description: 'AI-powered pod system with app control', price: 7, images: ['/images/products/17.jpg'], category: 'pod-system', rating: 4.7, reviews: 22, inStock: true },
      
      // E-Liquids
      { name: 'Strawberry E-Liquid', description: 'Premium strawberry flavor - 30ml', price: 10, images: ['/images/products/18.jpg'], category: 'e-liquid', rating: 4.4, reviews: 89, inStock: true },
      { name: 'Blue Razz E-Liquid', description: 'Sweet blue raspberry flavor - 30ml', price: 10, images: ['/images/products/19.jpg'], category: 'e-liquid', rating: 4.3, reviews: 76, inStock: true },
      { name: 'Tobacco Gold E-Liquid', description: 'Classic tobacco flavor - 30ml', price: 10, images: ['/images/products/20.jpg'], category: 'e-liquid', rating: 4.0, reviews: 54, inStock: true },
      { name: 'Watermelon E-Liquid', description: 'Fresh watermelon flavor - 30ml', price: 20, images: ['/images/products/21.jpg'], category: 'e-liquid', rating: 4.2, reviews: 63, inStock: true },
      { name: 'Coffee Cream E-Liquid', description: 'Rich coffee with cream - 30ml', price: 20, images: ['/images/products/22.jpg'], category: 'e-liquid', rating: 4.1, reviews: 41, inStock: true },
      
      // Accessories
      { name: 'Premium Carrying Case', description: 'Luxury leather carrying case', price: 20, images: ['/images/products/23.jpg'], category: 'accessories', rating: 4.3, reviews: 28, inStock: true },
      { name: 'Charging Dock Station', description: 'Multi-device charging station', price: 20, images: ['/images/products/24.jpg'], category: 'accessories', rating: 4.5, reviews: 19, inStock: true },
      { name: 'Coil Pack (5-Pack)', description: 'Replacement coils for various devices', price: 20, images: ['/images/products/25.jpg'], category: 'accessories', rating: 4.6, reviews: 87, inStock: true },
      
    ]

    for (const productData of demoProducts) {
      const product: LocalProduct = {
        id: Date.now().toString() + Math.random(),
        ...productData,
        vendorId: vendor.id,
        vendorName: vendor.name,
        inStock: productData.inStock ?? true,
        specifications: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      this.db.products.push(product)
    }

    saveLocalDB(this.db)
    console.log('✅ Demo products seeded')
  }

  async seedDemoUsers() {
    const demoUsers = [
      { email: 'vendor@vape4you.com', password: 'password123', name: 'VapeShop Pro', role: 'vendor' },
      { email: 'vendor2@vape4you.com', password: 'password123', name: 'Cloud Master', role: 'vendor' },
      { email: 'vendor3@vape4you.com', password: 'password123', name: 'Vape Elite', role: 'vendor' },
      { email: 'client@vape4you.com', password: 'password123', name: 'John Doe', role: 'client' },
      { email: 'client2@vape4you.com', password: 'password123', name: 'Sarah Wilson', role: 'client' },
      { email: 'client3@vape4you.com', password: 'password123', name: 'Mike Johnson', role: 'client' }
    ]

    for (const userData of demoUsers) {
      const userExists = this.db.users.some(u => u.email === userData.email)
      if (!userExists) {
        await this.createUser(userData as any)
        console.log(`✅ Demo ${userData.role} user created: ${userData.name}`)
      }
    }

    // Seed products after users
    await this.seedDemoProducts()

    return { success: true }
  }

  // Chat methods
  async createChatSession(vendorId: string, clientId: string) {
    const vendor = this.db.users.find(u => u.id === vendorId && u.role === 'vendor')
    const client = this.db.users.find(u => u.id === clientId && u.role === 'client')
    
    if (!vendor || !client) {
      throw new Error('Vendor or client not found')
    }

    // Check if session already exists
    const existingSession = this.db.chatSessions.find(s => 
      s.participants.vendorId === vendorId && s.participants.clientId === clientId
    )
    
    if (existingSession) {
      return existingSession
    }

    const session: ChatSession = {
      id: Date.now().toString(),
      participants: {
        vendorId,
        vendorName: vendor.name,
        clientId,
        clientName: client.name
      },
      unreadCount: {
        vendor: 0,
        client: 0
      },
      createdAt: new Date().toISOString()
    }

    this.db.chatSessions.push(session)
    this.saveDB()
    return session
  }

  async sendMessage(senderId: string, recipientId: string, message: string) {
    const sender = this.db.users.find(u => u.id === senderId)
    const recipient = this.db.users.find(u => u.id === recipientId)
    
    if (!sender || !recipient) {
      throw new Error('Sender or recipient not found')
    }

    // Ensure different roles
    if (sender.role === recipient.role) {
      throw new Error('Can only message users with different roles')
    }

    // Create or get chat session
    const vendorId = sender.role === 'vendor' ? senderId : recipientId
    const clientId = sender.role === 'client' ? senderId : recipientId
    
    const session = await this.createChatSession(vendorId, clientId)

    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId: session.id,
      senderId,
      senderName: sender.name,
      senderRole: sender.role,
      recipientId,
      recipientName: recipient.name,
      message,
      timestamp: new Date().toISOString(),
      read: false
    }

    this.db.chatMessages.push(chatMessage)
    
    // Update session
    session.lastMessage = message
    session.lastMessageTime = chatMessage.timestamp
    
    // Update unread count
    if (recipient.role === 'vendor') {
      session.unreadCount.vendor++
    } else {
      session.unreadCount.client++
    }

    this.saveDB()
    return chatMessage
  }

  async getChatSessions(userId: string) {
    const user = this.db.users.find(u => u.id === userId)
    if (!user) return []

    return this.db.chatSessions.filter(session => 
      session.participants.vendorId === userId || session.participants.clientId === userId
    ).sort((a, b) => 
      new Date(b.lastMessageTime || b.createdAt).getTime() - 
      new Date(a.lastMessageTime || a.createdAt).getTime()
    )
  }

  async getChatMessages(sessionId: string, userId: string) {
    const session = this.db.chatSessions.find(s => s.id === sessionId)
    if (!session) return []

    // Verify user is part of this session
    if (session.participants.vendorId !== userId && session.participants.clientId !== userId) {
      return []
    }

    return this.db.chatMessages
      .filter(msg => msg.chatId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  async markMessagesAsRead(sessionId: string, userId: string) {
    const session = this.db.chatSessions.find(s => s.id === sessionId)
    if (!session) return

    const user = this.db.users.find(u => u.id === userId)
    if (!user) return

    // Mark messages as read
    this.db.chatMessages
      .filter(msg => msg.chatId === sessionId && msg.recipientId === userId)
      .forEach(msg => msg.read = true)

    // Reset unread count
    if (user.role === 'vendor') {
      session.unreadCount.vendor = 0
    } else {
      session.unreadCount.client = 0
    }

    this.saveDB()
  }

  async getAvailableUsers(currentUserId: string) {
    const currentUser = this.db.users.find(u => u.id === currentUserId)
    if (!currentUser) return []

    // Return users with opposite role
    const targetRole = currentUser.role === 'vendor' ? 'client' : 'vendor'
    return this.db.users
      .filter(u => u.role === targetRole && u.id !== currentUserId)
      .map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        online: false // Will be updated by real-time system
      }))
  }

  // Order methods
  async createOrder(orderData: {
    userId: string
    items: { productId: string, productName: string, quantity: number, price: number }[]
    total: number
    paymentMethod: string
    shippingAddress: any
    status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  }) {
    const order: LocalOrder = {
      id: Date.now().toString(),
      userId: orderData.userId,
      items: orderData.items,
      total: orderData.total,
      status: orderData.status || 'pending',
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'pending',
      shippingAddress: orderData.shippingAddress,
      trackingNumber: `VY${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.db.orders.push(order)
    this.saveDB()
    return order
  }

  async getUserOrders(userId: string) {
    return this.db.orders
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async getOrderById(orderId: string) {
    return this.db.orders.find(order => order.id === orderId)
  }

  async updateOrderStatus(orderId: string, status: LocalOrder['status'], paymentStatus?: LocalOrder['paymentStatus']) {
    const order = this.db.orders.find(o => o.id === orderId)
    if (!order) return null

    order.status = status
    if (paymentStatus) order.paymentStatus = paymentStatus
    order.updatedAt = new Date().toISOString()
    
    this.saveDB()
    return order
  }

  async updateOrder(orderId: string, orderData: Partial<LocalOrder>) {
    const orderIndex = this.db.orders.findIndex(o => o.id === orderId)
    if (orderIndex === -1) return null

    this.db.orders[orderIndex] = {
      ...this.db.orders[orderIndex],
      ...orderData,
      updatedAt: new Date().toISOString()
    }

    this.saveDB()
    return this.db.orders[orderIndex]
  }

  private saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2))
  }

  async getOrders() {
    return this.db.orders
  }

  async getAllUsers() {
    return this.db.users
  }

  async seedDemoOrders() {
    // Check if orders already exist
    if (this.db.orders.length > 0) {
      return this.db.orders
    }

    const demoOrders = [
      {
        id: `VY${Date.now()}001`,
        userId: 'demo-user-1',
        items: [
          {
            productId: 'prod-1',
            productName: 'Premium Vape Pen',
            quantity: 1,
            price: 75.99
          }
        ],
        total: 75.99,
        status: 'pending' as const,
        paymentMethod: 'Bitcoin',
        paymentStatus: 'completed' as const,
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'USA',
          email: 'john@example.com'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        updatedAt: new Date().toISOString()
      },
      {
        id: `VY${Date.now()}002`,
        userId: 'demo-user-2',
        items: [
          {
            productId: 'prod-2',
            productName: 'Disposable Vape',
            quantity: 2,
            price: 21.25
          }
        ],
        total: 42.50,
        status: 'processing' as const,
        paymentMethod: 'PayPal',
        paymentStatus: 'completed' as const,
        shippingAddress: {
          firstName: 'Sarah',
          lastName: 'Wilson',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          postalCode: '90210',
          country: 'USA',
          email: 'sarah@example.com'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        updatedAt: new Date().toISOString()
      },
      {
        id: `VY${Date.now()}003`,
        userId: 'demo-user-3',
        items: [
          {
            productId: 'prod-3',
            productName: 'Vape Kit Bundle',
            quantity: 1,
            price: 128.75
          }
        ],
        total: 128.75,
        status: 'shipped' as const,
        paymentMethod: 'CashApp',
        paymentStatus: 'completed' as const,
        shippingAddress: {
          firstName: 'Mike',
          lastName: 'Johnson',
          address: '789 Pine St',
          city: 'Chicago',
          postalCode: '60601',
          country: 'USA',
          email: 'mike@example.com'
        },
        trackingNumber: 'TRK123456789',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        updatedAt: new Date().toISOString()
      }
    ]

    this.db.orders = demoOrders
    saveLocalDB(this.db)
    return demoOrders
  }
}

export const localDB = new LocalDatabase()