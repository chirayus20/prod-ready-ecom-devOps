import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center font-black text-lg">S</div>
              <span className="text-xl font-bold">Shop<span className="gradient-text">Verse</span></span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your premium destination for electronics, fashion, accessories & more. Shop the universe of style.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Shop</h4>
            <ul className="space-y-2">
              {['Electronics', 'Watches', 'Sunglasses', 'Bags', 'Shoes', 'Clothing'].map(cat => (
                <li key={cat}>
                  <Link to={`/products?category=${cat.toLowerCase()}`} className="text-sm text-gray-400 hover:text-brand-400 transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Account</h4>
            <ul className="space-y-2">
              {[
                { label: 'My Profile', to: '/profile' },
                { label: 'My Orders', to: '/orders' },
                { label: 'Wishlist', to: '/wishlist' },
                { label: 'Cart', to: '/cart' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-gray-400 hover:text-brand-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>help@shopverse.com</li>
              <li>+91 98765 43210</li>
              <li>Mon-Sat: 9AM - 9PM</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 ShopVerse. All rights reserved. Built with Flask + React.</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <span className="hover:text-gray-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
