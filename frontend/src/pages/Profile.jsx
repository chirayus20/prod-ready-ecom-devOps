import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, isAuthenticated, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.updateProfile(form)
      await refreshUser()
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Account Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your personal information and contact details</p>
      </div>

      <form onSubmit={handleUpdate} className="bg-surface-800/95 border border-white/10 rounded-2xl p-7 shadow-2xl space-y-6">
        <div className="flex items-center gap-5 pb-6 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-brand-500/20">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.first_name} {user?.last_name}</h2>
            <p className="text-gray-400 text-sm font-mono">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold uppercase tracking-wider">
                {user?.role}
              </span>
              <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                Verified Account
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">First Name</label>
            <input
              type="text"
              required
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">Last Name</label>
            <input
              type="text"
              required
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">Phone Number</label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">Email Address</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="input-field opacity-60 cursor-not-allowed bg-white/5"
          />
          <span className="text-[11px] text-gray-500 mt-1 block">Email address cannot be changed once registered</span>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-8 disabled:opacity-50">
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
