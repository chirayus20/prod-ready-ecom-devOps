import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  HiOutlineCurrencyDollar,
  HiOutlineShoppingBag,
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlineExclamationCircle,
  HiOutlineStar,
  HiOutlineTrendingUp,
  HiOutlineCreditCard,
  HiArrowRight,
  HiRefresh
} from 'react-icons/hi'
import { adminAPI } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboard = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await adminAPI.dashboard()
      setStats(res.data.data)
    } catch (err) {
      toast.error('Failed to load dashboard metrics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login')
      return
    }
    fetchDashboard()
  }, [isAdmin, navigate])

  if (loading) return <PageLoader />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">Admin Overview</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Aiven Cloud MySQL
            </span>
          </div>
          <p className="text-gray-400 mt-1">
            Centralized e-commerce data management: Users, Catalog, Inventory, Orders, Payments & Reviews in Aiven MySQL
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm"
          >
            <HiRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <Link to="/admin/products" className="btn-primary py-2 px-4 text-sm">
            Manage Products
          </Link>
          <Link to="/admin/orders" className="btn-secondary py-2 px-4 text-sm">
            Manage Orders
          </Link>
        </div>
      </div>

      {/* Database status indicator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Primary Database: Aiven Cloud MySQL
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Handles Users, Products, Categories, Orders, Cart, Inventory, Payments & Reviews
            </p>
          </div>
          <span className="text-xs font-mono bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded">
            Connected
          </span>
        </div>

        <div className="glass-card p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Product Media Storage
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Multipart Image Uploads with S3 Cloud Integration Interface
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded">
            Active
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-sm font-medium">Total Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <HiOutlineCurrencyDollar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            ${stats?.total_revenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </div>
          <span className="text-xs text-gray-400 mt-1 block">From confirmed & completed orders (MySQL)</span>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-sm font-medium">Total Orders</span>
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <HiOutlineShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total_orders || 0}</div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
            <span>Pending: <strong className="text-amber-400">{stats?.pending_orders || 0}</strong></span>
            <span>Payments: <strong className="text-emerald-400">{stats?.total_payments || 0}</strong></span>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-sm font-medium">Catalog & Inventory</span>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <HiOutlineCube className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total_products || 0}</div>
          <div className="text-xs mt-1">
            {stats?.low_stock_count > 0 ? (
              <span className="text-red-400 flex items-center gap-1">
                <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
                {stats.low_stock_count} item(s) low stock
              </span>
            ) : (
              <span className="text-emerald-400">Inventory levels healthy</span>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-sm font-medium">Customer Reviews</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <HiOutlineStar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            {stats?.avg_rating || '5.0'}
            <span className="text-xs font-normal text-gray-400">/ 5.0</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
            <span>{stats?.total_reviews || 0} reviews</span>
            <span>Returns: {stats?.pending_returns || 0}</span>
          </div>
        </div>
      </div>

      {/* Quick Action & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium">
              View all <HiArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-400 border-b border-white/10 uppercase">
                <tr>
                  <th className="pb-3">Order #</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recent_orders && stats.recent_orders.length > 0 ? (
                  stats.recent_orders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-mono font-medium text-white">{o.order_number}</td>
                      <td className="py-3 text-gray-400 text-xs">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-white font-semibold">${o.total?.toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          o.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          o.status === 'shipped' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          o.status === 'confirmed' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                          o.status === 'cancelled' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/orders/${o.id}`}
                          className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-400 text-sm">
                      No recent orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Management Cards */}
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-white mb-2">Catalog Operations</h3>
            <p className="text-xs text-gray-400 mb-4">
              Add new apparel or accessories, update inventory counts, manage prices and variants.
            </p>
            <Link
              to="/admin/products"
              className="w-full btn-primary py-2.5 px-4 text-center text-sm font-semibold block"
            >
              Open Product Manager
            </Link>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-white mb-2">Order Fulfillment</h3>
            <p className="text-xs text-gray-400 mb-4">
              Confirm pending orders, update tracking status, and manage refunds directly in MySQL.
            </p>
            <Link
              to="/admin/orders"
              className="w-full btn-secondary py-2.5 px-4 text-center text-sm font-semibold block"
            >
              Open Order Queue
            </Link>
          </div>

          <div className="glass-card p-6 border border-brand-500/20 bg-brand-500/5">
            <div className="flex items-center gap-2 text-brand-300 font-semibold text-sm mb-2">
              <HiOutlineTrendingUp className="w-4 h-4 text-brand-400" />
              Developer Insight
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              All transactions, order items, inventory locks, payments, and shipment tracking are ACID-committed in <strong>Aiven Cloud MySQL</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
