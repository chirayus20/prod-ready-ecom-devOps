import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sv_token')
      localStorage.removeItem('sv_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (data) => API.put('/auth/profile', data),
  getAddresses: () => API.get('/auth/addresses'),
  addAddress: (data) => API.post('/auth/addresses', data),
}

// ── Products ────────────────────────────────────────────────────
export const productsAPI = {
  list: (params) => API.get('/products', { params }),
  get: (id) => API.get(`/products/${id}`),
}

// ── Categories ──────────────────────────────────────────────────
export const categoriesAPI = {
  list: () => API.get('/categories'),
}

// ── Cart ────────────────────────────────────────────────────────
export const cartAPI = {
  get: () => API.get('/cart'),
  addItem: (data) => API.post('/cart/items', data),
  updateItem: (id, data) => API.put(`/cart/items/${id}`, data),
  removeItem: (id) => API.delete(`/cart/items/${id}`),
  clear: () => API.delete('/cart'),
}

// ── Wishlist ────────────────────────────────────────────────────
export const wishlistAPI = {
  list: () => API.get('/wishlist'),
  add: (productId) => API.post(`/wishlist/${productId}`),
  remove: (productId) => API.delete(`/wishlist/${productId}`),
}

// ── Orders ──────────────────────────────────────────────────────
export const ordersAPI = {
  checkout: (data) => API.post('/orders/checkout', data),
  list: (params) => API.get('/orders', { params }),
  get: (id) => API.get(`/orders/${id}`),
  cancel: (id) => API.post(`/orders/${id}/cancel`),
}

// ── Reviews ─────────────────────────────────────────────────────
export const reviewsAPI = {
  getForProduct: (productId) => API.get(`/reviews/product/${productId}`),
  create: (productId, data) => API.post(`/reviews/product/${productId}`, data),
}

// ── Returns ─────────────────────────────────────────────────────
export const returnsAPI = {
  request: (data) => API.post('/returns', data),
  list: () => API.get('/returns'),
}

// ── Admin ───────────────────────────────────────────────────────
export const adminAPI = {
  dashboard: () => API.get('/admin/dashboard'),
  listProducts: (params) => API.get('/admin/products', { params }),
  createProduct: (data) => API.post('/admin/products', data),
  updateProduct: (id, data) => API.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => API.delete(`/admin/products/${id}`),
  uploadImage: (formData) => API.post('/admin/products/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  listOrders: (params) => API.get('/admin/orders', { params }),
  updateOrderStatus: (id, data) => API.put(`/admin/orders/${id}/status`, data),
  listCustomers: (params) => API.get('/admin/customers', { params }),
}

// ── Health ──────────────────────────────────────────────────────
export const healthAPI = {
  check: () => API.get('/health'),
}

export default API
