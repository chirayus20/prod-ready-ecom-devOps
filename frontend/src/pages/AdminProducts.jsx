import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiOutlineCube,
  HiSearch,
  HiX,
  HiCheck,
  HiUpload,
} from 'react-icons/hi'
import { adminAPI, categoriesAPI } from '../api/axios'
import { PageLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    compare_price: '',
    category_id: '',
    brand: '',
    stock: 50,
    description: '',
    image: '',
  })

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File size must be under 10MB')
    }

    const uploadData = new FormData()
    uploadData.append('file', file)

    setUploadingImage(true)
    try {
      const res = await adminAPI.uploadImage(uploadData)
      const fileUrl = res.data.data.url
      setFormData((prev) => ({ ...prev, image: fileUrl }))
      toast.success('Image uploaded successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const loadData = async (targetPage = 1) => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        adminAPI.listProducts({ page: targetPage, per_page: 10 }),
        categoriesAPI.list(),
      ])
      setProducts(prodRes.data.data)
      setPagination(prodRes.data.pagination)
      setCategories(catRes.data.data || [])
      setPage(targetPage)
    } catch (err) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(1)
  }, [])

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      price: '',
      compare_price: '',
      category_id: categories[0]?.id || '',
      brand: '',
      stock: 50,
      description: '',
      image: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (p) => {
    setEditingProduct(p)
    setFormData({
      name: p.name || '',
      sku: p.sku || '',
      price: p.price || '',
      compare_price: p.compare_price || '',
      category_id: p.category_id || '',
      brand: p.brand || '',
      stock: p.stock ?? 50,
      description: p.description || '',
      image: p.images?.[0] || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      name: formData.name,
      sku: formData.sku,
      price: parseFloat(formData.price),
      compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      brand: formData.brand,
      stock: parseInt(formData.stock),
      description: formData.description,
      images: formData.image ? [formData.image] : [],
    }

    try {
      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, payload)
        toast.success('Product updated successfully')
      } else {
        await adminAPI.createProduct(payload)
        toast.success('Product created successfully')
      }
      setModalOpen(false)
      loadData(page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`Are you sure you want to deactivate "${p.name}"?`)) return
    try {
      await adminAPI.deleteProduct(p.id)
      toast.success('Product deactivated')
      loadData(page)
    } catch (err) {
      toast.error('Failed to deactivate product')
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="text-gray-400 hover:text-white text-sm">
              &larr; Admin
            </Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-2xl font-bold text-white">Product Catalog</h1>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Stored in <strong>Cloud MySQL</strong> &bull; Changes instantly reflect on the customer storefront
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary py-2.5 px-4 flex items-center gap-2 text-sm self-start sm:self-auto font-medium"
        >
          <HiPlus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products by title, SKU, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm w-full"
          />
        </div>
        <div className="text-xs text-gray-400">
          Showing {filtered.length} of {pagination?.total || products.length} products
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-400 border-b border-white/10 uppercase bg-surface-950/40">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length > 0 ? (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-surface-800 border border-white/10"
                          />
                          <div>
                            <div className="font-medium text-white line-clamp-1">{p.name}</div>
                            <div className="text-xs text-gray-400">{p.brand || 'Unbranded'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-300">{p.sku}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">${p.price?.toFixed(2)}</span>
                        {p.compare_price && (
                          <span className="text-xs text-gray-500 line-through ml-2">
                            ${p.compare_price?.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            (p.stock ?? 50) < 10 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {p.stock ?? 50}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            p.is_active !== false
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {p.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Edit Product"
                          >
                            <HiPencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition-colors"
                            title="Deactivate Product"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400 text-sm">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-white/10 text-xs text-gray-400">
              <div>
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadData(pagination.page - 1)}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadData(pagination.page + 1)}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for Add / Edit Product */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <HiX className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Classic Chronograph Watch"
                  className="input-field w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-field w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Fastrack, Urban, etc."
                    className="input-field w-full text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input-field w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Compare Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.compare_price}
                    onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                    className="input-field w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="input-field w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="input-field w-full text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Product Image</label>
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Image URL or upload a file"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="input-field flex-1 text-sm"
                    />
                    <label className={`btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <HiUpload className="w-4 h-4 text-brand-400" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleImageFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {formData.image && (
                    <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-lg border border-white/10 bg-surface-950"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                      <div className="text-xs truncate flex-1 min-w-0">
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Image Preview</span>
                        <span className="text-brand-300 truncate font-mono text-[11px] block">{formData.image}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                        title="Remove image"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full text-sm"
                  placeholder="Product specs, materials, warranty..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-sm font-semibold flex items-center gap-2"
                >
                  {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
