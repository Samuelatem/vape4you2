'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { formatDistance } from 'date-fns'
import { playNotificationSound } from '@/lib/notifications'

interface OrderItem {
  productId: string
  productName: string
  productImage: string
  quantity: number
  price: number
}

interface Order {
  _id: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: string
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  createdAt: string
  updatedAt: string
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Pending'
  },
  processing: {
    icon: Package,
    color: 'bg-blue-100 text-blue-800',
    label: 'Processing'
  },
  shipped: {
    icon: Package,
    color: 'bg-purple-100 text-purple-800',
    label: 'Shipped'
  },
  delivered: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    label: 'Delivered'
  },
  cancelled: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    label: 'Cancelled'
  }
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const socket = useSocket({ userId: session?.user?.id as string, userName: session?.user?.name as string, userRole: 'client' })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchOrders()
    // join socket for real-time updates
    if (socket) {
      socket.on('order-updated', (updatedOrder: any) => {
        setOrders(prev => prev.map(o => o._id === (updatedOrder._id || updatedOrder.id) ? { ...o, ...updatedOrder } : o))
      })
      socket.on('order-created', (newOrder: any) => {
        // Only add if belongs to this user
        if (newOrder.userId === session.user.id) {
          setOrders(prev => [newOrder, ...prev])
        }
      })
      socket.on('order-status-changed', ({ orderId, status, timestamp }: { orderId: string; status: string; timestamp: string }) => {
        console.log(`📦 Order ${orderId} status changed to ${status}`)
        // Update the order status in real-time
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: status as any, updatedAt: timestamp } : o))
        // Play sound notification to alert customer of order update
        playNotificationSound('order-update')
      })
    }
  }, [session, status, router, socket])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Failed fetching orders')
      const data = await res.json()
      if (data.success && data.orders) {
        setOrders(data.orders)
      } else if (Array.isArray(data)) {
        setOrders(data)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here.</p>
            <Button
              onClick={() => router.push('/products')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order._id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Placed {formatDistance(new Date(order.createdAt), new Date(), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[order.status].color}`}>
                        <StatusIcon className="w-4 h-4 mr-1" />
                        {statusConfig[order.status].label}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/orders/${order._id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div className="flex-shrink-0 w-16 h-16 relative">
                            <Image
                              src={item.productImage}
                              alt={item.productName}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.productName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Payment: {order.paymentMethod}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        Total: {formatPrice(order.total)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}