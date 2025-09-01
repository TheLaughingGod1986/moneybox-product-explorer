import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { body, param, validationResult } from 'express-validator';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

// Performance monitoring middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'unknown'
    };
    
    // Log performance (in production, send to monitoring service)
    if (duration > 200) {
      console.warn('⚠️  SLOW API RESPONSE:', logData);
    } else {
      console.log('✅ API Response:', logData);
    }
  });
  
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 20, // stricter limit for write operations
  message: {
    error: 'Too many write requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

// Apply rate limiting
app.use('/api/', limiter);

// Input validation helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Utility functions
const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return default data if file doesn't exist
    const defaultData = {
      categories: [
        {
          id: 'savings',
          name: 'Savings',
          order: 1,
          products: [
            {
              id: 'cash-isa',
              name: 'Cash ISA',
              description: 'A tax-free way to save up to £20,000 per year',
              icon: '💰',
              order: 1
            }
          ]
        }
      ],
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    await writeData(defaultData);
    return defaultData;
  }
};

const writeData = async (data) => {
  data.metadata = {
    ...data.metadata,
    lastUpdated: new Date().toISOString()
  };
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
};

// API Routes
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'OK';
  let dataFileExists = false;
  
  try {
    // Check if data file is accessible
    await fs.access(DATA_FILE);
    dataFileExists = true;
    
    // Test data read performance
    const data = await readData();
    if (!data || !data.categories) {
      dbStatus = 'ERROR';
    }
  } catch (error) {
    dbStatus = 'ERROR';
  }
  
  const healthCheck = {
    status: dbStatus === 'OK' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    checks: {
      database: dbStatus,
      dataFile: dataFileExists,
      responseTime: `${Date.now() - startTime}ms`
    }
  };
  
  res.status(dbStatus === 'OK' ? 200 : 503).json(healthCheck);
});

// Get all categories and products
app.get('/api/categories', async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new category
app.post('/api/categories', 
  strictLimiter,
  [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be between 1 and 100 characters')
      .trim()
      .escape(),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim()
      .escape()
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const { name, description } = req.body;

    const data = await readData();
    const newCategory = {
      id: `category-${Date.now()}`,
      name,
      order: data.categories.length + 1,
      products: []
    };

    data.categories.push(newCategory);
    await writeData(data);
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Create new product  
app.post('/api/products',
  strictLimiter,
  [
    body('categoryId')
      .isLength({ min: 1 })
      .withMessage('Category ID is required')
      .trim(),
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Product name must be between 1 and 100 characters')
      .trim()
      .escape(),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters')
      .trim()
      .escape(),
    body('icon')
      .optional()
      .isLength({ max: 10 })
      .withMessage('Icon must not exceed 10 characters')
      .trim()
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const { categoryId, name, description, icon } = req.body;

    const data = await readData();
    const categoryIndex = data.categories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const newProduct = {
      id: `product-${Date.now()}`,
      name,
      description: description || '',
      icon: icon || '📦',
      order: data.categories[categoryIndex].products.length + 1
    };

    data.categories[categoryIndex].products.push(newProduct);
    await writeData(data);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update category
app.put('/api/categories/:id',
  strictLimiter,
  [
    param('id').isLength({ min: 1 }).withMessage('Category ID is required').trim(),
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be between 1 and 100 characters')
      .trim()
      .escape(),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim()
      .escape()
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const data = await readData();
    const categoryIndex = data.categories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Update category
    data.categories[categoryIndex] = {
      ...data.categories[categoryIndex],
      name,
      description: description || data.categories[categoryIndex].description,
      updatedAt: new Date().toISOString()
    };

    await writeData(data);
    res.json(data.categories[categoryIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readData();
    const categoryIndex = data.categories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Remove category
    data.categories.splice(categoryIndex, 1);
    await writeData(data);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, categoryId, order } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const data = await readData();
    let productFound = false;
    let updatedProduct = null;

    // Find product across all categories
    for (let categoryIndex = 0; categoryIndex < data.categories.length; categoryIndex++) {
      const productIndex = data.categories[categoryIndex].products.findIndex(prod => prod.id === id);
      
      if (productIndex !== -1) {
        // Update product
        data.categories[categoryIndex].products[productIndex] = {
          ...data.categories[categoryIndex].products[productIndex],
          name,
          description: description || data.categories[categoryIndex].products[productIndex].description,
          icon: icon || data.categories[categoryIndex].products[productIndex].icon,
          ...(order !== undefined && { order }),
          updatedAt: new Date().toISOString()
        };
        
        updatedProduct = data.categories[categoryIndex].products[productIndex];
        productFound = true;
        break;
      }
    }

    if (!productFound) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await writeData(data);
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Update product order within category
app.put('/api/categories/:categoryId/products/reorder', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { productOrders } = req.body; // Array of { id, order } objects
    
    if (!Array.isArray(productOrders)) {
      return res.status(400).json({ error: 'productOrders must be an array' });
    }

    const data = await readData();
    const category = data.categories.find(cat => cat.id === categoryId);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Update order for each product
    productOrders.forEach(({ id, order }) => {
      const product = category.products.find(p => p.id === id);
      if (product) {
        product.order = order;
        product.updatedAt = new Date().toISOString();
      }
    });

    // Sort products by order
    category.products.sort((a, b) => (a.order || 0) - (b.order || 0));

    await writeData(data);
    res.json({ 
      message: 'Product order updated successfully',
      products: category.products 
    });
  } catch (error) {
    console.error('Error updating product order:', error);
    res.status(500).json({ error: 'Failed to update product order' });
  }
});

// Bulk operations for products
app.post('/api/products/bulk', async (req, res) => {
  try {
    const { action, productIds, data } = req.body;
    
    if (!action || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Action and productIds array required' });
    }

    const dataFile = await readData();
    let results = [];
    let errors = [];

    switch (action) {
      case 'delete':
        for (const productId of productIds) {
          try {
            let productFound = false;
            
            // Find and remove product from all categories
            for (let categoryIndex = 0; categoryIndex < dataFile.categories.length; categoryIndex++) {
              const productIndex = dataFile.categories[categoryIndex].products.findIndex(p => p.id === productId);
              if (productIndex !== -1) {
                const removedProduct = dataFile.categories[categoryIndex].products.splice(productIndex, 1)[0];
                results.push({ id: productId, action: 'deleted', product: removedProduct });
                productFound = true;
                break;
              }
            }
            
            if (!productFound) {
              errors.push({ id: productId, error: 'Product not found' });
            }
          } catch (error) {
            errors.push({ id: productId, error: error.message });
          }
        }
        break;

      case 'update':
        if (!data) {
          return res.status(400).json({ error: 'Data object required for update action' });
        }
        
        for (const productId of productIds) {
          try {
            let productFound = false;
            
            // Find and update product in all categories
            for (let categoryIndex = 0; categoryIndex < dataFile.categories.length; categoryIndex++) {
              const productIndex = dataFile.categories[categoryIndex].products.findIndex(p => p.id === productId);
              if (productIndex !== -1) {
                dataFile.categories[categoryIndex].products[productIndex] = {
                  ...dataFile.categories[categoryIndex].products[productIndex],
                  ...data,
                  updatedAt: new Date().toISOString()
                };
                results.push({ 
                  id: productId, 
                  action: 'updated', 
                  product: dataFile.categories[categoryIndex].products[productIndex] 
                });
                productFound = true;
                break;
              }
            }
            
            if (!productFound) {
              errors.push({ id: productId, error: 'Product not found' });
            }
          } catch (error) {
            errors.push({ id: productId, error: error.message });
          }
        }
        break;

      case 'move':
        const { targetCategoryId } = data || {};
        if (!targetCategoryId) {
          return res.status(400).json({ error: 'targetCategoryId required for move action' });
        }

        const targetCategory = dataFile.categories.find(c => c.id === targetCategoryId);
        if (!targetCategory) {
          return res.status(400).json({ error: 'Target category not found' });
        }

        for (const productId of productIds) {
          try {
            let productFound = false;
            
            // Find product and move to target category
            for (let categoryIndex = 0; categoryIndex < dataFile.categories.length; categoryIndex++) {
              const productIndex = dataFile.categories[categoryIndex].products.findIndex(p => p.id === productId);
              if (productIndex !== -1) {
                const product = dataFile.categories[categoryIndex].products.splice(productIndex, 1)[0];
                product.updatedAt = new Date().toISOString();
                targetCategory.products.push(product);
                results.push({ id: productId, action: 'moved', product, targetCategory: targetCategoryId });
                productFound = true;
                break;
              }
            }
            
            if (!productFound) {
              errors.push({ id: productId, error: 'Product not found' });
            }
          } catch (error) {
            errors.push({ id: productId, error: error.message });
          }
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid action. Supported: delete, update, move' });
    }

    await writeData(dataFile);

    res.json({
      message: `Bulk ${action} completed`,
      results,
      errors,
      processed: results.length,
      failed: errors.length
    });

  } catch (error) {
    console.error('Error in bulk operation:', error);
    res.status(500).json({ error: 'Failed to perform bulk operation' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readData();
    let productFound = false;

    // Find and remove product from its category
    for (let categoryIndex = 0; categoryIndex < data.categories.length; categoryIndex++) {
      const productIndex = data.categories[categoryIndex].products.findIndex(prod => prod.id === id);
      
      if (productIndex !== -1) {
        data.categories[categoryIndex].products.splice(productIndex, 1);
        productFound = true;
        break;
      }
    }

    if (!productFound) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await writeData(data);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Image upload endpoints
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

// Upload image endpoint (handles base64 data)
app.post('/api/images/upload', async (req, res) => {
  try {
    const { imageData, name, type } = req.body;
    
    if (!imageData || !name || !type) {
      return res.status(400).json({ error: 'Missing required fields: imageData, name, type' });
    }

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid image type' });
    }

    // Extract base64 data
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const extension = type.split('/')[1];
    const filename = `${timestamp}_${randomId}.${extension}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Ensure uploads directory exists
    await ensureUploadsDir();

    // Save file
    await fs.writeFile(filepath, buffer);

    // Return image info
    const imageInfo = {
      id: `img_${timestamp}_${randomId}`,
      name,
      filename,
      type,
      size: buffer.length,
      url: `/api/images/${filename}`,
      uploadedAt: new Date().toISOString()
    };

    res.json(imageInfo);

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Serve uploaded images
app.get('/api/images/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join(UPLOADS_DIR, filename);
    
    // Check if file exists
    try {
      await fs.access(filepath);
    } catch {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }

    // Set cache headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000', // 1 year
      'ETag': filename
    });

    // Stream the file
    const fileBuffer = await fs.readFile(filepath);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Delete image endpoint
app.delete('/api/images/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join(UPLOADS_DIR, filename);
    
    // Check if file exists and delete
    try {
      await fs.unlink(filepath);
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'Image not found' });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// List images endpoint
app.get('/api/images', async (req, res) => {
  try {
    await ensureUploadsDir();
    
    const files = await fs.readdir(UPLOADS_DIR);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    const images = await Promise.all(
      imageFiles.map(async (filename) => {
        const filepath = path.join(UPLOADS_DIR, filename);
        const stats = await fs.stat(filepath);
        
        const parts = filename.split('_');
        const timestamp = parts[0];
        const randomId = parts[1]?.split('.')[0];
        
        return {
          id: `img_${timestamp}_${randomId}`,
          filename,
          url: `/api/images/${filename}`,
          size: stats.size,
          uploadedAt: new Date(parseInt(timestamp)).toISOString()
        };
      })
    );

    // Sort by upload date (newest first)
    images.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({ images, total: images.length });

  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});