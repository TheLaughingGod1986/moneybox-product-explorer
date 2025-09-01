import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Categories
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  
  // Products
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  reorderProducts: (categoryId, productOrders) => api.put(`/categories/${categoryId}/products/reorder`, { productOrders }),
  bulkOperation: (action, productIds, data = null) => api.post('/products/bulk', { action, productIds, data }),
  
  // Images
  uploadImage: (imageData, name, type) => api.post('/images/upload', { imageData, name, type }),
  getImages: () => api.get('/images'),
  deleteImage: (filename) => api.delete(`/images/${filename}`),
  
  // Health check
  healthCheck: () => api.get('/health'),
};

export default apiService;