import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiChevronRight } from 'react-icons/hi'
import { ordersAPI } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/LoadingSpinner'

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  shipped: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-rose-500/20 text-rose-400',
}

export default function OrderHistory() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    ordersAPI.list().then(res => setOrders(res.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [isAuthenticated])

  if (loading) return <PageLoader />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-gray-400 mb-6">Start shopping to see your orders here</p>
          <Link to="/products" className="btn-primary inline-block">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="glass-card p-5 flex items-center justify-between hover:border-brand-500/30 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-brand-400">{order.order_number}</span>
                  <span className={`badge text-xs ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {order.items?.length || 0} items • ₹{order.total?.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {order.shipment && (
                  <p className="text-xs text-purple-400 mt-1">
                    🚚 {order.shipment.status} {order.shipment.tracking_number && `• ${order.shipment.tracking_number}`}
                  </p>
                )}
              </div>
              <HiChevronRight className="w-5 h-5 text-gray-500" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
