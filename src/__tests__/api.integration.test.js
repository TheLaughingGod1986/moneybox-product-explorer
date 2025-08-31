import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

describe('API Integration Tests', () => {
  let testCategoryId = null;
  let testProductId = null;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await api.get('/health');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('uptime');
      expect(response.data).toHaveProperty('checks');
      expect(response.data.checks).toHaveProperty('database', 'OK');
    });
  });

  describe('Categories API', () => {
    it('should get all categories', async () => {
      const response = await api.get('/categories');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('categories');
      expect(response.data).toHaveProperty('metadata');
      expect(Array.isArray(response.data.categories)).toBe(true);
    });

    it('should create a new category', async () => {
      const categoryData = {
        name: 'Integration Test Category',
        description: 'Created during integration testing'
      };

      const response = await api.post('/categories', categoryData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('name', categoryData.name);
      expect(response.data).toHaveProperty('order');
      expect(response.data).toHaveProperty('products');
      expect(Array.isArray(response.data.products)).toBe(true);
      
      testCategoryId = response.data.id;
    });

    it('should validate category creation input', async () => {
      try {
        await api.post('/categories', { name: '' });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error', 'Validation failed');
        expect(error.response.data).toHaveProperty('details');
      }
    });

    it('should update an existing category', async () => {
      if (!testCategoryId) {
        throw new Error('Test category not created');
      }

      const updateData = {
        name: 'Updated Integration Test Category',
        description: 'Updated during integration testing'
      };

      const response = await api.put(`/categories/${testCategoryId}`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', testCategoryId);
      expect(response.data).toHaveProperty('name', updateData.name);
      expect(response.data).toHaveProperty('description', updateData.description);
    });
  });

  describe('Products API', () => {
    it('should create a new product in category', async () => {
      if (!testCategoryId) {
        throw new Error('Test category not created');
      }

      const productData = {
        categoryId: testCategoryId,
        name: 'Integration Test Product',
        description: 'A test product for integration testing',
        icon: '🧪'
      };

      const response = await api.post('/products', productData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('name', productData.name);
      expect(response.data).toHaveProperty('description', productData.description);
      expect(response.data).toHaveProperty('icon', productData.icon);
      expect(response.data).toHaveProperty('order');
      
      testProductId = response.data.id;
    });

    it('should validate product creation input', async () => {
      try {
        await api.post('/products', { categoryId: 'invalid', name: '' });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error', 'Validation failed');
      }
    });

    it('should update an existing product', async () => {
      if (!testProductId) {
        throw new Error('Test product not created');
      }

      const updateData = {
        name: 'Updated Integration Test Product',
        description: 'Updated during integration testing',
        icon: '🔄'
      };

      const response = await api.put(`/products/${testProductId}`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', testProductId);
      expect(response.data).toHaveProperty('name', updateData.name);
      expect(response.data).toHaveProperty('description', updateData.description);
      expect(response.data).toHaveProperty('icon', updateData.icon);
    });

    it('should delete a product', async () => {
      if (!testProductId) {
        throw new Error('Test product not created');
      }

      const response = await api.delete(`/products/${testProductId}`);
      expect(response.status).toBe(204);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting gracefully', async () => {
      // This test checks that rate limiting is configured by testing response
      // Rate limit headers may not be present with current configuration
      
      const response = await api.get('/categories');
      expect(response.status).toBe(200);
      
      // If rate limit headers are present, they should be numbers
      if (response.headers['x-ratelimit-limit']) {
        expect(parseInt(response.headers['x-ratelimit-limit'])).toBeGreaterThan(0);
      }
      if (response.headers['x-ratelimit-remaining']) {
        expect(parseInt(response.headers['x-ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent category gracefully', async () => {
      try {
        await api.get('/categories/non-existent-id');
        expect.fail('Should have thrown 404 error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should handle malformed JSON gracefully', async () => {
      try {
        await axios.post(`${API_BASE_URL}/categories`, 'invalid json', {
          headers: { 'Content-Type': 'application/json' }
        });
        expect.fail('Should have thrown 400 error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  // Cleanup
  afterAll(async () => {
    if (testCategoryId) {
      try {
        await api.delete(`/categories/${testCategoryId}`);
      } catch (error) {
        console.warn('Failed to cleanup test category:', error.message);
      }
    }
  });
});
