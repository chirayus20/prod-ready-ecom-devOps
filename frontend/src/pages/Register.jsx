import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) { navigate('/'); return null }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      return toast.error('Please fill all required fields')
    }
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')

    setLoading(true)
    try {
      await register(form)
      toast.success('Account created successfully!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    }
    finally { setLoading(false) }
  }

  const update = (field, value) => setForm({ ...form, [field]: value })

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center font-black text-2xl mx-auto mb-4">S</div>
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-gray-400 mt-2">Join ShopVerse for exclusive deals</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">First Name</label>
              <input type="text" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} className="input-field" placeholder="Rahul" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Last Name</label>
              <input type="text" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} className="input-field" placeholder="Sharma" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" placeholder="rahul@example.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Phone (optional)</label>
            <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field" placeholder="Min 6 characters" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
