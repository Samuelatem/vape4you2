'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Plus, Edit, Trash2, Package, DollarSign, Users, ShoppingCart, TrendingUp, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { useSocket } from '@/hooks/useSocket'

interface VendorProduct {
  id?: string
  _id?: string
  name: string
  price: number
  category: string
  image?: string
  images?: string[]
  inStock: boolean
  rating: number
  reviews: number | any[]
}

interface VendorStats {
  totalProducts: number
  totalRevenue: number
  totalCustomers: number
  totalOrders: number
  pendingOrders: number
  shippedOrders: number
  deliveredOrders: number
  inStockProducts: number
  outOfStockProducts: number
}

interface VendorOrder {
  id: string
  customerName: string
  customerEmail: string
  total: number
  status: string
  paymentMethod: string
  createdAt: string
  itemCount: number
  items: any[]
}

export default function VendorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    inStockProducts: 0,
    outOfStockProducts: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const socket = useSocket({ userId: session?.user?.id as string, userName: session?.user?.name as string, userRole: 'vendor' })

  const fetchVendorData = useCallback(async () => {
    try {
      // Fetch vendor products
      const productsRes = await fetch('/api/vendor/products')
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        // Ensure products is always an array
        setProducts(Array.isArray(productsData) ? productsData : [])
      } else if (productsRes.status === 401) {
        // User is not a vendor, redirect to login
        router.push('/auth/login')
        return
      } else {
        console.error('Failed to fetch products:', productsRes.status, productsRes.statusText)
        setProducts([]) // Set empty array on error
      }

      // Fetch vendor statistics
      const statsRes = await fetch('/api/vendor/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      } else {
        console.error('Failed to fetch stats:', statsRes.status, statsRes.statusText)
      }

      // Fetch vendor orders
      const ordersRes = await fetch('/api/vendor/orders')
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        // Ensure orders is always an array
        setOrders(Array.isArray(ordersData) ? ordersData : [])
      } else {
        console.error('Failed to fetch orders:', ordersRes.status, ordersRes.statusText)
        setOrders([]) // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error)
      // Set empty arrays on any error
      setProducts([])
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.email) {
      router.push('/auth/login')
      return
    }

    // Check if user is a vendor by making an API call instead of relying on session.user.role
    fetchVendorData()
    
    // Set up real-time socket listeners
    if (socket) {
      socket.on('order-created', (order: any) => {
        // Prepend new order
        setOrders(prev => [order, ...prev])
        // Refresh stats
        fetchVendorData()
      })

      socket.on('order-updated', (updatedOrder: any) => {
        setOrders(prev => prev.map(o => (o.id === (updatedOrder.id || updatedOrder._id) ? { ...o, ...updatedOrder } : o)))
        // Refresh stats to reflect counts
        fetchVendorData()
      })
    }

    // Keep a fallback periodic refresh as safety
    const interval = setInterval(fetchVendorData, 30000)
    setRefreshInterval(interval)

    return () => {
      if (socket) {
        socket.off('order-created')
        socket.off('order-updated')
      }
      if (interval) clearInterval(interval)
    }
  }, [session, status, router, fetchVendorData, socket])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus
        }),
      })

      if (response.ok) {
        // Refresh orders data
        fetchVendorData()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to update order status'}`)
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session?.user?.email) {
    return null
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      format: (val: number) => val.toString(),
      onClick: () => setSelectedView('products')
    },
    {
      title: 'Total Revenue',
      value: stats.totalRevenue,
      icon: DollarSign,
      color: 'bg-green-500',
      format: (val: number) => formatPrice(val),
      onClick: () => setSelectedView('revenue')
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-purple-500',
      format: (val: number) => val.toString(),
      onClick: () => setSelectedView('customers')
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      format: (val: number) => val.toString(),
      onClick: () => setSelectedView('orders')
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user.name}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={stat.onClick}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.format(stat.value)}
                    </p>
                    <p className="text-xs text-purple-600 font-medium">Click for details</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-sm font-medium text-yellow-600">{stats.pendingOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Shipped</span>
                <span className="text-sm font-medium text-blue-600">{stats.shippedOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Delivered</span>
                <span className="text-sm font-medium text-green-600">{stats.deliveredOrders}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Stock</span>
                <span className="text-sm font-medium text-green-600">{stats.inStockProducts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Out of Stock</span>
                <span className="text-sm font-medium text-red-600">{stats.outOfStockProducts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Stock Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalProducts > 0 ? 
                    Math.round((stats.inStockProducts / stats.totalProducts) * 100) : 0
                  }%
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. Order Value</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalOrders > 0 ? 
                    formatPrice(stats.totalRevenue / stats.totalOrders) : 
                    formatPrice(0)
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Revenue per Customer</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalCustomers > 0 ? 
                    formatPrice(stats.totalRevenue / stats.totalCustomers) : 
                    formatPrice(0)
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Orders per Customer</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalCustomers > 0 ? 
                    (stats.totalOrders / stats.totalCustomers).toFixed(1) : 
                    '0.0'
                  }
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detailed View Modal */}
        {selectedView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedView === 'products' && 'Product Details'}
                    {selectedView === 'revenue' && 'Revenue Breakdown'}
                    {selectedView === 'customers' && 'Customer Analytics'}
                    {selectedView === 'orders' && 'Order Analytics'}
                  </h2>
                  <button
                    onClick={() => setSelectedView(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Product Details View */}
                {selectedView === 'products' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total Products</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.totalProducts}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">In Stock</p>
                        <p className="text-2xl font-bold text-green-900">{stats.inStockProducts}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">Out of Stock</p>
                        <p className="text-2xl font-bold text-red-900">{stats.outOfStockProducts}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Revenue Details View */}
                {selectedView === 'revenue' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-900">{formatPrice(stats.totalRevenue)}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Average Order Value</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {stats.totalOrders > 0 ? formatPrice(stats.totalRevenue / stats.totalOrders) : formatPrice(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Details View */}
                {selectedView === 'customers' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Total Customers</p>
                        <p className="text-2xl font-bold text-purple-900">{stats.totalCustomers}</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Revenue per Customer</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {stats.totalCustomers > 0 ? formatPrice(stats.totalRevenue / stats.totalCustomers) : formatPrice(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders Details View */}
                {selectedView === 'orders' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-600 font-medium">Pending</p>
                        <p className="text-2xl font-bold text-yellow-900">{stats.pendingOrders}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Shipped</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.shippedOrders}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Delivered</p>
                        <p className="text-2xl font-bold text-green-900">{stats.deliveredOrders}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 font-medium">Total</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Platform Products</h2>
              <p className="text-sm text-gray-600">Manage all products in the platform</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => router.push('/products')}
                variant="outline"
              >
                View Store
              </Button>
              <Button
                onClick={() => router.push('/vendor/products/new')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

          {!products || products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">Start by adding products to the platform.</p>
              <Button
                onClick={() => router.push('/vendor/products/new')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(products || []).map((product) => (
                    <tr key={product.id || product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-12 h-12 relative">
                            <Image
                              src={product.image || product.images?.[0] || '/images/products/placeholder.jpg'}
                              alt={product.name || 'Product'}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name || 'Unnamed Product'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {(product.category || 'uncategorized').replace('-', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(product.price || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.inStock !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(product.rating || 0).toFixed(1)} ({Array.isArray(product.reviews) ? product.reviews.length : product.reviews || 0} reviews)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/products`)}
                            title="View in store"
                          >
                            👁️
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/vendor/products/${product.id || product._id}/edit`)}
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this product?')) {
                                // TODO: Implement delete functionality
                                alert('Delete functionality coming soon!')
                              }
                            }}
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Button
              variant="outline"
              onClick={() => router.push('/vendor/orders')}
            >
              View All Orders
            </Button>
          </div>

          {!orders || orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">Orders will appear here when customers make purchases.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(orders || []).slice(0, 10).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {order.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'processing')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Process
                            </Button>
                          )}
                          {order.status === 'processing' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              Ship
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                              className="text-green-600 hover:text-green-700"
                            >
                              Mark Delivered
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/orders/${order.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}