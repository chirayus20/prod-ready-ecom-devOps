import { Link } from 'react-router-dom'
import { HiOutlineHeart, HiHeart, HiStar } from 'react-icons/hi'

export default function ProductCard({ product, onWishlistToggle, isWishlisted }) {
  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  const imgSrc = product.images?.[0] || `https://via.placeholder.com/400x400/1e293b/6366f1?text=${encodeURIComponent(product.name)}`

  return (
    <div className="glass-card overflow-hidden group">
      {/* Image */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden aspect-square">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            -{discount}%
          </span>
        )}
        {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-3 right-3 bg-amber-500/90 text-surface-900 text-xs font-bold px-2 py-1 rounded-lg">
            Only {product.stock} left
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-brand-400 font-medium mb-1">{product.brand || product.category_name}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2 hover:text-brand-300 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {(product.avg_rating > 0 || product.review_count > 0) && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-0.5 bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-semibold">
              <HiStar className="w-3 h-3" />
              {product.avg_rating}
            </div>
            <span className="text-xs text-gray-500">({product.review_count})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">₹{product.price?.toLocaleString('en-IN')}</span>
          {product.compare_price && (
            <span className="text-sm text-gray-500 line-through">₹{product.compare_price?.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>

      {/* Wishlist button */}
      {onWishlistToggle && (
        <button
          onClick={(e) => { e.preventDefault(); onWishlistToggle(product.id) }}
          className="absolute top-3 right-3 p-2 rounded-full bg-surface-900/70 backdrop-blur-sm hover:bg-surface-900 transition-all opacity-0 group-hover:opacity-100"
        >
          {isWishlisted ? (
            <HiHeart className="w-5 h-5 text-rose-500" />
          ) : (
            <HiOutlineHeart className="w-5 h-5 text-white" />
          )}
        </button>
      )}
    </div>
  )
}
