import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiTrash } from 'react-icons/hi'
import { wishlistAPI } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { PageLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Wishlist() {
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    wishlistAPI.list().then(res => setItems(res.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [isAuthenticated])

  const handleRemove = async (productId) => {
    try {
      await wishlistAPI.remove(productId)
      setItems(items.filter(i => i.product_id !== productId))
      toast.success('Removed from wishlist')
    } catch { toast.error('Failed to remove') }
  }

  const handleMoveToCart = async (item) => {
    await addToCart(item.product_id)
    handleRemove(item.product_id)
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">❤️</div>
          <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
          <p className="text-gray-400 mb-6">Save items you love for later</p>
          <Link to="/products" className="btn-primary inline-block">Explore Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="glass-card overflow-hidden group">
              <Link to={`/products/${item.product_id}`} className="block aspect-square overflow-hidden">
                <img
                  src={item.product?.images?.[0] || 'https://via.placeholder.com/300/1e293b/6366f1?text=Product'}
                  alt={item.product?.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </Link>
              <div className="p-4">
                <p className="text-xs text-brand-400 mb-1">{item.product?.brand}</p>
                <h3 className="text-sm font-semibold line-clamp-2 mb-2">{item.product?.name}</h3>
                <p className="font-bold mb-3">₹{item.product?.price?.toLocaleString('en-IN')}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleMoveToCart(item)} className="btn-primary flex-1 !py-2 text-xs">
                    Add to Cart
                  </button>
                  <button onClick={() => handleRemove(item.product_id)} className="p-2 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-all">
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
