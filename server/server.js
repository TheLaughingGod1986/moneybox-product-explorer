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
const PORT = process.env.PORT || 3001;
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    const { name, description, icon, categoryId } = req.body;
    
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});