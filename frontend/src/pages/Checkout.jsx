import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { HiCheckCircle, HiShieldCheck } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { ordersAPI } from '../api/axios'
import toast from 'react-hot-toast'

export default function Checkout() {
  const { isAuthenticated } = useAuth()
  const { cart, clearCart } = useCart()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(null)
  const [address, setAddress] = useState({
    street: '', city: '', state: '', zip_code: '', country: 'India',
  })

  const items = cart.items || []
  const subtotal = items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0)
  const tax = Math.round(subtotal * 0.18 * 100) / 100
  const shipping = subtotal >= 499 ? 0 : 49
  const total = subtotal + tax + shipping

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    for (const field of ['street', 'city', 'state', 'zip_code']) {
      if (!address[field]) return toast.error(`Please fill in ${field.replace('_', ' ')}`)
    }

    setLoading(true)
    try {
      const res = await ordersAPI.checkout({
        shipping_address: address,
        billing_address: address,
        payment_method: 'mock_card',
      })
      setOrderPlaced(res.data.data)
      await clearCart()
      toast.success('Order placed successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed')
    }
    finally { setLoading(false) }
  }

  // Order Confirmation Screen
  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <HiCheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-gray-400 mb-2">Order Number: <span className="font-mono text-brand-400">{orderPlaced.order_number}</span></p>
        <p className="text-gray-500 text-sm mb-8">Mock payment simulated successfully. Your order is being processed.</p>
        <div className="glass-card p-6 text-left mb-8">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {orderPlaced.items?.map(item => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-300">{item.product_name} × {item.quantity}</span>
                <span>₹{item.total_price?.toLocaleString('en-IN')}</span>
              </div>
            ))}
            <hr className="border-white/10 my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span><span>₹{orderPlaced.total?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <Link to={`/orders/${orderPlaced.id}`} className="btn-primary">View Order</Link>
          <Link to="/products" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Address Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-bold text-lg mb-5">Shipping Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Street Address</label>
                  <input type="text" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className="input-field" placeholder="123 Main Street, Apartment 4B" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">City</label>
                    <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="input-field" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">State</label>
                    <input type="text" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="input-field" placeholder="Maharashtra" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">ZIP Code</label>
                    <input type="text" value={address.zip_code} onChange={(e) => setAddress({ ...address, zip_code: e.target.value })} className="input-field" placeholder="400001" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Country</label>
                    <input type="text" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className="input-field" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Payment */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <h3 className="font-bold text-lg">Payment</h3>
                <span className="badge bg-amber-500/20 text-amber-400 text-xs">Mock / Demo</span>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <HiShieldCheck className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300">Simulated Payment</p>
                  <p className="text-xs text-gray-400 mt-1">
                    This is a demo checkout. No real payment will be processed. The mock adapter will simulate a successful payment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="glass-card p-6 h-fit sticky top-24">
            <h3 className="font-bold text-lg mb-5">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-300 truncate mr-2">{item.product?.name} × {item.quantity}</span>
                  <span className="flex-shrink-0">₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <hr className="border-white/10 mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">GST (18%)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Shipping</span><span className={shipping === 0 ? 'text-emerald-400' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
              <hr className="border-white/10" />
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            </div>
            <button type="submit" disabled={loading || items.length === 0} className="btn-accent w-full mt-6 disabled:opacity-50">
              {loading ? 'Processing...' : `Pay ₹${total.toLocaleString('en-IN')}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
