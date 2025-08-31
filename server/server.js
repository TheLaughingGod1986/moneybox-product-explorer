import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

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
app.post('/api/products', async (req, res) => {
  try {
    const { categoryId, name, description, icon } = req.body;
    if (!categoryId || !name) {
      return res.status(400).json({ error: 'Category ID and product name are required' });
    }

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
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

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