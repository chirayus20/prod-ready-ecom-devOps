import { Link } from 'react-router-dom'
import { HiTrash, HiArrowRight } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { isAuthenticated } = useAuth()
  const { cart, updateQuantity, removeItem, clearCart } = useCart()
  const items = cart.items || []

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-2">Please login to view your cart</h2>
        <Link to="/login" className="btn-primary inline-block mt-4">Sign In</Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-400 mb-6">Add some products to get started!</p>
        <Link to="/products" className="btn-primary inline-block">Browse Products</Link>
      </div>
    )
  }

  const subtotal = items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0)
  const tax = Math.round(subtotal * 0.18 * 100) / 100
  const shipping = subtotal >= 499 ? 0 : 49
  const total = subtotal + tax + shipping

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <button onClick={clearCart} className="text-sm text-rose-400 hover:text-rose-300 transition-colors">
          Clear Cart
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="glass-card p-4 flex gap-4">
              <Link to={`/products/${item.product_id}`} className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={item.product?.images?.[0] || 'https://via.placeholder.com/100x100/1e293b/6366f1?text=Product'}
                  alt={item.product?.name}
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product_id}`}>
                  <h3 className="font-semibold text-sm truncate hover:text-brand-400 transition-colors">{item.product?.name}</h3>
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">{item.product?.brand}</p>
                <p className="text-lg font-bold mt-2">₹{item.product?.price?.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-all">
                  <HiTrash className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-0 rounded-lg overflow-hidden border border-white/10 text-sm">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 bg-white/5 hover:bg-white/10">−</button>
                  <span className="px-3 py-1 bg-white/5 font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 bg-white/5 hover:bg-white/10">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="glass-card p-6 h-fit sticky top-24">
          <h3 className="font-bold text-lg mb-5">Order Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Tax (18% GST)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-400">Shipping</span>
              <span className={shipping === 0 ? 'text-emerald-400' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>
            {subtotal < 499 && (
              <p className="text-xs text-amber-400">Add ₹{(499 - subtotal).toFixed(0)} more for free shipping!</p>
            )}
            <hr className="border-white/10" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <Link to="/checkout" className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
            Proceed to Checkout <HiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
