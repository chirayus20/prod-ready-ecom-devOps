import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HiAdjustments, HiX } from 'react-icons/hi'
import { productsAPI, categoriesAPI } from '../api/axios'
import ProductCard from '../components/ProductCard'
import { ProductSkeleton } from '../components/LoadingSpinner'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const currentCategory = searchParams.get('category') || ''
  const currentSearch = searchParams.get('search') || ''
  const currentSort = searchParams.get('sort') || 'newest'
  const currentPage = parseInt(searchParams.get('page') || '1')
  const currentMinPrice = searchParams.get('min_price') || ''
  const currentMaxPrice = searchParams.get('max_price') || ''

  useEffect(() => {
    categoriesAPI.list().then(res => setCategories(res.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = { page: currentPage, per_page: 12, sort: currentSort }
        if (currentCategory) params.category = currentCategory
        if (currentSearch) params.search = currentSearch
        if (currentMinPrice) params.min_price = currentMinPrice
        if (currentMaxPrice) params.max_price = currentMaxPrice

        const res = await productsAPI.list(params)
        setProducts(res.data.data)
        setPagination(res.data.pagination)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetchProducts()
  }, [currentCategory, currentSearch, currentSort, currentPage, currentMinPrice, currentMaxPrice])

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page') params.delete('page')
    setSearchParams(params)
  }

  const clearFilters = () => setSearchParams({})

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {currentSearch ? `Results for "${currentSearch}"` : currentCategory ? categories.find(c => c.slug === currentCategory)?.name || 'Products' : 'All Products'}
          </h1>
          {pagination.total !== undefined && (
            <p className="text-gray-400 text-sm mt-1">{pagination.total} products found</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="md:hidden btn-secondary !py-2 !px-4 text-sm flex items-center gap-2">
            <HiAdjustments className="w-4 h-4" /> Filters
          </button>
          <select
            value={currentSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="input-field !w-auto !py-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="name">Name: A → Z</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className={`${filtersOpen ? 'fixed inset-0 z-50 bg-surface-900 p-6 overflow-y-auto' : 'hidden'} md:block md:relative md:w-56 flex-shrink-0`}>
          <div className="flex items-center justify-between md:hidden mb-6">
            <h3 className="text-lg font-bold">Filters</h3>
            <button onClick={() => setFiltersOpen(false)}><HiX className="w-6 h-6" /></button>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-3">Category</h4>
            <div className="space-y-1">
              <button
                onClick={() => updateParam('category', '')}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!currentCategory ? 'bg-brand-500/20 text-brand-300' : 'hover:bg-white/5 text-gray-300'}`}
              >All</button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { updateParam('category', cat.slug); setFiltersOpen(false) }}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${currentCategory === cat.slug ? 'bg-brand-500/20 text-brand-300' : 'hover:bg-white/5 text-gray-300'}`}
                >{cat.name}</button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-3">Price Range</h4>
            <div className="flex gap-2">
              <input
                type="number" placeholder="Min"
                value={currentMinPrice}
                onChange={(e) => updateParam('min_price', e.target.value)}
                className="input-field !py-2 text-sm"
              />
              <input
                type="number" placeholder="Max"
                value={currentMaxPrice}
                onChange={(e) => updateParam('max_price', e.target.value)}
                className="input-field !py-2 text-sm"
              />
            </div>
          </div>

          {(currentCategory || currentSearch || currentMinPrice || currentMaxPrice) && (
            <button onClick={clearFilters} className="text-sm text-rose-400 hover:text-rose-300 transition-colors">
              Clear all filters
            </button>
          )}
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {loading
              ? Array(12).fill(0).map((_, i) => <ProductSkeleton key={i} />)
              : products.map(p => <ProductCard key={p.id} product={p} />)
            }
          </div>

          {!loading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-2xl font-bold text-gray-500 mb-2">No products found</p>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => updateParam('page', String(page))}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                    page === currentPage
                      ? 'bg-brand-500 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >{page}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
