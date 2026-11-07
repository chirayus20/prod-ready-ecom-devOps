import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiEye,
  HiRefresh
} from 'react-icons/hi'
import { adminAPI } from '../api/axios'
import { PageLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const loadOrders = async (targetPage = 1, filter = statusFilter) => {
    setLoading(true)
    try {
      const params = { page: targetPage, per_page: 10 }
      if (filter) params.status = filter
      const res = await adminAPI.listOrders(params)
      setOrders(res.data.data)
      setPagination(res.data.pagination)
      setPage(targetPage)
    } catch (err) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(1, statusFilter)
  }, [statusFilter])

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      await adminAPI.updateOrderStatus(orderId, { status: newStatus })
      toast.success(`Order status changed to "${newStatus}" & synced to Supabase!`)
      loadOrders(page, statusFilter)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  const statuses = [
    { label: 'All Orders', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
      case 'shipped':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      case 'confirmed':
        return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
      case 'cancelled':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
      default:
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="text-gray-400 hover:text-white text-sm">
              &larr; Admin
            </Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-2xl font-bold text-white">Order Management</h1>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Orders, payment transactions & shipment tracking managed in <strong>Aiven Cloud MySQL</strong>
          </p>
        </div>

        <button
          onClick={() => loadOrders(page, statusFilter)}
          className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <HiRefresh className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Cross-DB Note */}
      <div className="glass-card p-4 mb-6 border border-brand-500/30 bg-brand-500/5 flex items-start gap-3 text-xs">
        <HiOutlineTruck className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-brand-300 font-semibold">Dual Database Flow:</span>
          <span className="text-gray-300 ml-1">
            Changing an order to <em>"shipped"</em> or <em>"delivered"</em> creates a real-time tracking event in Supabase's <code>shipment_tracking</code> table, updating customer tracking timelines immediately.
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === s.value
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                : 'glass-card text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-400 border-b border-white/10 uppercase bg-surface-950/40">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Change Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.length > 0 ? (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-white text-xs">
                        {o.order_number}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-300">
                        {o.items?.length || 1} item(s)
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        ${o.total?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-300 uppercase font-mono">
                          {o.payment_method || 'CARD'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          disabled={updatingId === o.id}
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className="bg-surface-800 text-white text-xs rounded-lg px-2 py-1 border border-white/10 focus:outline-none focus:border-brand-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/orders/${o.id}`}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-brand-400 hover:text-brand-300 transition-colors inline-flex items-center gap-1 text-xs font-medium"
                          title="View Order Details"
                        >
                          <HiEye className="w-4 h-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-gray-400 text-sm">
                      No orders found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-white/10 text-xs text-gray-400">
              <div>
                Page {pagination.page} of {pagination.pages} ({pagination.total} orders)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadOrders(pagination.page - 1)}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadOrders(pagination.page + 1)}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
