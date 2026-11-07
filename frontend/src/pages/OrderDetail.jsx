import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi'
import { ordersAPI, returnsAPI } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  success: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-rose-500/20 text-rose-400',
  refunded: 'bg-amber-500/20 text-amber-400',
}

export default function OrderDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    ordersAPI.get(id).then(res => setOrder(res.data.data)).catch(() => toast.error('Order not found')).finally(() => setLoading(false))
  }, [id, isAuthenticated])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    try {
      const res = await ordersAPI.cancel(id)
      setOrder(res.data.data)
      toast.success('Order cancelled')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel')
    }
  }

  const handleReturn = async () => {
    try {
      await returnsAPI.request({ order_id: parseInt(id), reason: 'Requested by customer' })
      toast.success('Return requested successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request return')
    }
  }

  if (loading) return <PageLoader />
  if (!order) return <div className="text-center py-20 text-gray-400">Order not found</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <Link to="/orders" className="flex items-center gap-1 text-sm text-gray-400 hover:text-brand-400 mb-6 transition-colors">
        <HiArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`badge text-sm border ${statusColors[order.status] || ''}`}>
          {order.status?.toUpperCase()}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="space-y-3">
              {order.items?.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                    {item.product_image && <img src={item.product_image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <Link to={`/products/${item.product_id}`} className="text-sm font-medium hover:text-brand-400 transition-colors">{item.product_name}</Link>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × ₹{item.unit_price?.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="font-semibold text-sm">₹{item.total_price?.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment (PostgreSQL data) */}
          {order.payment && (
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3">Payment Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">Transaction</span><p className="font-mono text-xs mt-0.5">{order.payment.transaction_ref}</p></div>
                <div><span className="text-gray-400">Status</span><p className="mt-0.5"><span className={`badge text-xs ${statusColors[order.payment.status]}`}>{order.payment.status}</span></p></div>
                <div><span className="text-gray-400">Provider</span><p className="mt-0.5">{order.payment.provider}</p></div>
                <div><span className="text-gray-400">Amount</span><p className="font-semibold mt-0.5">₹{order.payment.amount?.toLocaleString('en-IN')}</p></div>
              </div>
            </div>
          )}

          {/* Shipment Tracking (PostgreSQL data) */}
          {order.shipment && (
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3">Shipment Tracking</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className={`badge text-xs ${statusColors[order.shipment.status] || 'bg-gray-500/20 text-gray-400'}`}>
                  {order.shipment.status}
                </span>
                <span className="text-xs text-gray-400">Carrier: {order.shipment.carrier}</span>
                {order.shipment.tracking_number && (
                  <span className="font-mono text-xs text-brand-400">{order.shipment.tracking_number}</span>
                )}
              </div>
              {order.shipment.events?.length > 0 && (
                <div className="space-y-3 border-l-2 border-brand-500/30 pl-4">
                  {order.shipment.events.map((event, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-surface-900" />
                      <p className="text-sm font-medium">{event.status}</p>
                      <p className="text-xs text-gray-400">{event.location} • {new Date(event.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Tax</span><span>₹{order.tax?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Shipping</span><span>{order.shipping_fee === 0 ? 'FREE' : `₹${order.shipping_fee}`}</span></div>
              <hr className="border-white/10" />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{order.total?.toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {!['delivered', 'cancelled'].includes(order.status) && (
              <button onClick={handleCancel} className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 text-sm font-medium hover:bg-rose-500/10 transition-colors">
                Cancel Order
              </button>
            )}
            {order.status === 'delivered' && (
              <button onClick={handleReturn} className="w-full py-2.5 rounded-xl border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/10 transition-colors">
                Request Return
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
