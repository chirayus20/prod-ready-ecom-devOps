import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  HiOutlineShoppingCart,
  HiOutlineHeart,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineLogout,
  HiChevronDown,
  HiMenu,
  HiX,
} from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { itemCount } = useCart()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const navigate = useNavigate()

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  return (
    <nav className="sticky top-0 z-40 bg-surface-900/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
              S
            </div>
            <span className="text-xl font-bold hidden sm:block">
              Shop<span className="gradient-text">Verse</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, brands, categories..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            <Link to="/wishlist" className="p-2 rounded-xl hover:bg-white/10 transition-colors relative text-gray-300 hover:text-white" title="Wishlist">
              <HiOutlineHeart className="w-6 h-6" />
            </Link>

            <Link to="/cart" className="p-2 rounded-xl hover:bg-white/10 transition-colors relative text-gray-300 hover:text-white" title="Cart">
              <HiOutlineShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full text-xs font-bold flex items-center justify-center animate-pulse-slow text-white shadow-md">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-white"
                  aria-expanded={profileOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                    {user?.first_name?.[0] || 'U'}
                  </div>
                  <span className="hidden lg:block text-sm font-medium">{user?.first_name}</span>
                  <HiChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 hidden sm:block ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 bg-surface-800 border border-white/15 rounded-2xl shadow-2xl shadow-black/90 py-2 z-50 animate-fade-in divide-y divide-white/10">
                    {/* User Info Header */}
                    <div className="px-4 py-3">
                      <p className="font-semibold text-sm text-white truncate">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                      <span className="badge bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] mt-2 font-bold uppercase tracking-wider">
                        {user?.role}
                      </span>
                    </div>

                    {/* Menu Links */}
                    <div className="py-1.5 space-y-0.5 px-1.5">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <HiOutlineUser className="w-4 h-4 text-gray-400" />
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <HiOutlineShoppingCart className="w-4 h-4 text-gray-400" />
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <HiOutlineHeart className="w-4 h-4 text-gray-400" />
                        Wishlist
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-brand-300 hover:text-white hover:bg-brand-500/20 rounded-xl transition-colors font-medium"
                        >
                          <span className="w-2 h-2 rounded-full bg-brand-400" />
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    {/* Logout Button */}
                    <div className="pt-1.5 px-1.5">
                      <button
                        onClick={() => { logout(); setProfileOpen(false); navigate('/') }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                      >
                        <HiOutlineLogout className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm !py-2 !px-4">
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-xl hover:bg-white/10 text-white">
              {menuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile search + menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-white/10 animate-slide-up">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-brand-500"
                />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              <Link to="/products" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-gray-200">All Products</Link>
              <Link to="/products?category=electronics" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-gray-200">Electronics</Link>
              <Link to="/products?category=watches" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-gray-200">Watches</Link>
              <Link to="/products?category=sunglasses" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-gray-200">Sunglasses</Link>
              <Link to="/products?category=bags" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-gray-200">Bags</Link>
              <Link to="/products?category=shoes" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-gray-200">Shoes</Link>
              <Link to="/products?category=clothing" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-gray-200">Clothing</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
