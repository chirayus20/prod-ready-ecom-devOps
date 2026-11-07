import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { HiStar, HiOutlineHeart, HiHeart, HiShoppingCart, HiArrowLeft } from 'react-icons/hi'
import { productsAPI, reviewsAPI, wishlistAPI } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { PageLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [wishlisted, setWishlisted] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const res = await productsAPI.get(id)
        setProduct(res.data.data)
      } catch {
        toast.error('Product not found')
      }
      finally { setLoading(false) }
    }
    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    if (!isAuthenticated) return toast.error('Please login first')
    addToCart(product.id, quantity)
  }

  const toggleWishlist = async () => {
    if (!isAuthenticated) return toast.error('Please login first')
    try {
      if (wishlisted) {
        await wishlistAPI.remove(product.id)
        setWishlisted(false)
        toast.success('Removed from wishlist')
      } else {
        await wishlistAPI.add(product.id)
        setWishlisted(true)
        toast.success('Added to wishlist')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) return toast.error('Please login first')
    setSubmittingReview(true)
    try {
      await reviewsAPI.create(product.id, reviewForm)
      toast.success('Review submitted!')
      const res = await productsAPI.get(id)
      setProduct(res.data.data)
      setReviewForm({ rating: 5, title: '', body: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review')
    }
    finally { setSubmittingReview(false) }
  }

  if (loading) return <PageLoader />
  if (!product) return <div className="text-center py-20 text-gray-400">Product not found</div>

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/products" className="flex items-center gap-1 hover:text-brand-400 transition-colors">
          <HiArrowLeft className="w-4 h-4" /> Products
        </Link>
        <span>/</span>
        <span className="text-gray-300">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="glass-card overflow-hidden aspect-square mb-4">
            <img
              src={product.images?.[selectedImage] || `https://via.placeholder.com/600x600/1e293b/6366f1?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    i === selectedImage ? 'border-brand-500' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-brand-400 text-sm font-medium mb-2">{product.brand}</p>
          <h1 className="text-3xl font-bold mb-3">{product.name}</h1>

          {/* Rating */}
          {product.review_count > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-sm font-semibold">
                <HiStar className="w-4 h-4" />
                {product.avg_rating}
              </div>
              <span className="text-gray-400 text-sm">{product.review_count} reviews</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl font-black">₹{product.price?.toLocaleString('en-IN')}</span>
            {product.compare_price && (
              <>
                <span className="text-xl text-gray-500 line-through">₹{product.compare_price?.toLocaleString('en-IN')}</span>
                <span className="badge bg-emerald-500/20 text-emerald-400 text-sm">{discount}% off</span>
              </>
            )}
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">{product.description}</p>

          {/* Stock */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="badge bg-emerald-500/20 text-emerald-400">✓ In Stock ({product.stock} available)</span>
            ) : (
              <span className="badge bg-rose-500/20 text-rose-400">✗ Out of Stock</span>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-gray-400">Quantity:</span>
            <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-white/10">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 bg-white/5 hover:bg-white/10 transition-colors text-lg">−</button>
              <span className="px-5 py-2 bg-white/5 min-w-[50px] text-center font-semibold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 bg-white/5 hover:bg-white/10 transition-colors text-lg">+</button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiShoppingCart className="w-5 h-5" /> Add to Cart
            </button>
            <button onClick={toggleWishlist} className="btn-secondary !px-4">
              {wishlisted ? <HiHeart className="w-6 h-6 text-rose-500" /> : <HiOutlineHeart className="w-6 h-6" />}
            </button>
          </div>

          {/* Meta info */}
          <div className="glass rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">SKU</span><span>{product.sku}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Category</span><span>{product.category_name}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Shipping</span><span className="text-emerald-400">Free above ₹499</span></div>
          </div>
        </div>
      </div>

      {/* ── Reviews Section ──────────────────────────────────────── */}
      <section className="mt-16">
        <h2 className="section-title mb-8">Customer Reviews</h2>

        {/* Review Form */}
        {isAuthenticated && (
          <form onSubmit={submitReview} className="glass-card p-6 mb-8">
            <h3 className="font-semibold mb-4">Write a Review</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-400">Rating:</span>
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })}>
                  <HiStar className={`w-6 h-6 transition-colors ${star <= reviewForm.rating ? 'text-amber-400' : 'text-gray-600'}`} />
                </button>
              ))}
            </div>
            <input
              type="text" placeholder="Review title" value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              className="input-field mb-3"
            />
            <textarea
              placeholder="Write your review..." value={reviewForm.body}
              onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
              className="input-field mb-4 h-24 resize-none"
            />
            <button type="submit" disabled={submittingReview} className="btn-primary text-sm">
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {product.reviews?.length > 0 ? product.reviews.map(review => (
            <div key={review.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                    {review.reviewer_name?.[0] || 'C'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{review.reviewer_name}</p>
                    <div className="flex items-center gap-1">
                      {Array(5).fill(0).map((_, i) => (
                        <HiStar key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400' : 'text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                {review.is_verified && <span className="badge bg-emerald-500/20 text-emerald-400 text-xs">Verified</span>}
              </div>
              {review.title && <h4 className="font-semibold text-sm mb-1">{review.title}</h4>}
              <p className="text-sm text-gray-300">{review.body}</p>
            </div>
          )) : (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
          )}
        </div>
      </section>
    </div>
  )
}
