import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiArrowRight, HiStar, HiLightningBolt, HiShieldCheck, HiTruck } from 'react-icons/hi'
import { productsAPI, categoriesAPI } from '../api/axios'
import ProductCard from '../components/ProductCard'
import { ProductSkeleton } from '../components/LoadingSpinner'

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productsAPI.list({ per_page: 8, sort: 'newest' }),
          categoriesAPI.list(),
        ])
        setProducts(prodRes.data.data)
        setCategories(catRes.data.data)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  return (
    <div className="animate-fade-in">
      {/* ── Hero Banner ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-surface-900 to-purple-950" />
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 25% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 75% 50%, #a855f7 0%, transparent 50%)'}} />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <HiLightningBolt className="w-4 h-4" />
              New Season Collection 2026
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
              Discover Your
              <br />
              <span className="gradient-text">Perfect Style</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-lg leading-relaxed">
              Explore premium electronics, fashion accessories, watches & more. Curated collections with unbeatable deals.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary text-base !py-4 !px-8 flex items-center gap-2">
                Shop Now <HiArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/products?sort=price_asc" className="btn-secondary text-base !py-4 !px-8">
                Best Deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Badges ─────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-surface-950/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: HiTruck, label: 'Free Shipping', desc: 'On orders ₹499+' },
              { icon: HiShieldCheck, label: 'Secure Payment', desc: 'SSL Encrypted' },
              { icon: HiStar, label: 'Top Quality', desc: 'Premium brands' },
              { icon: HiLightningBolt, label: 'Fast Delivery', desc: '3-5 business days' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Shop by Category</h2>
          <Link to="/products" className="text-brand-400 text-sm font-medium flex items-center gap-1 hover:text-brand-300 transition-colors">
            View All <HiArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="glass-card overflow-hidden group text-center"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={cat.image_url || `https://via.placeholder.com/300x300/1e293b/6366f1?text=${cat.name}`}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Trending Now</h2>
          <Link to="/products" className="text-brand-400 text-sm font-medium flex items-center gap-1 hover:text-brand-300 transition-colors">
            See All <HiArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            : products.map(p => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-purple-600 p-8 md:p-16">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Get 20% Off Your First Order</h2>
            <p className="text-white/80 mb-6">Sign up today and unlock exclusive deals, early access to sales, and more.</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors">
              Create Account <HiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
