import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Settings, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { apiService } from '../services/api.js';
import RichTextEditor from './RichTextEditor.jsx';
import DraggableList from './DraggableList.jsx';
import BulkActionsToolbar from './BulkActionsToolbar.jsx';
import PreviewModal from './PreviewModal.jsx';
import LivePreview from './LivePreview.jsx';
import ImageUploader from './ImageUploader.jsx';
import ImageGallery from './ImageGallery.jsx';

const ProductCard = ({ product, isExpanded, onToggle }) => {
  // Map product names to their corresponding SVG icons
  const getProductIcon = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('cash isa')) return '/images/icons/cash_isa.svg';
    if (name.includes('stocks & shares isa') || name.includes('stocks and shares isa')) return '/images/icons/stocks_shares_isa.svg';
    if (name.includes('lifetime isa')) return '/images/icons/lifetime_isa.svg';
    if (name.includes('junior isa')) return '/images/icons/junior_isa.svg';
    if (name.includes('personal pension')) return '/images/icons/personal_pension.svg';
    if (name.includes('simple saver')) return '/images/icons/simple_saver.svg';
    if (name.includes('32 day notice')) return '/images/icons/32_day_notice.svg';
    if (name.includes('95 day notice')) return '/images/icons/95_day_notice.svg';
    if (name.includes('general investment account')) return '/images/icons/general_investment_account.svg';
    if (name.includes('open access cash isa')) return '/images/icons/open_access_cash_isa.svg';
    return '/images/icons/cash_isa.svg'; // default fallback
  };

  // Check if the product has an emoji icon (old format) or should use SVG
  const shouldUseEmoji = product.icon && product.icon.length <= 2 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(product.icon);
  
  // Get the correct icon path for the product
  const getIconPath = (productIcon) => {
    if (shouldUseEmoji) return null; // Use emoji instead
    if (productIcon && productIcon.includes('_')) {
      return `/images/icons/${productIcon}.svg`;
    }
    return getProductIcon(product.name); // Fallback to name-based mapping
  };

  return (
    <div className="product-card">
      <div className="product-header" onClick={onToggle}>
        <span className="product-name">
          {product.name}
        </span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {isExpanded && (
        <div className="product-content expanded">
          <div className="product-details">
            {shouldUseEmoji ? (
              <span className="product-icon">{product.icon}</span>
            ) : (
              <img src={getIconPath(product.icon)} alt="" className="product-icon" />
            )}
            <div 
              className="product-description"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryCard = ({ category, expandedProducts, onProductToggle, onEdit, onDelete, isAdmin }) => {
  return (
    <div className="category-card">
      <div className="category-header">
        <h3 className="category-title">
          {category.name}
        </h3>
        {isAdmin && (
          <div className="admin-actions">
            <button onClick={() => onEdit(category)} className="admin-btn">
              <Edit size={14} />
            </button>
            <button onClick={() => onDelete(category.id)} className="admin-btn delete">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="products-list">
        {category.products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            isExpanded={expandedProducts.includes(product.id)}
            onToggle={() => onProductToggle(product.id)}
          />
        ))}
      </div>
    </div>
  );
};

const AdminPanel = ({ data, onDataUpdate, onClose }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newProductData, setNewProductData] = useState({ name: '', description: '', icon: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [previewModal, setPreviewModal] = useState({ isOpen: false, data: null });
  const [livePreviewVisible, setLivePreviewVisible] = useState(false);
  const [draftData, setDraftData] = useState({});
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [productImages, setProductImages] = useState([]);

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      await apiService.createCategory({ name: newCategoryName });
      setNewCategoryName('');
      onDataUpdate(); // Trigger refresh
    } catch (err) {
      setError('Failed to create category: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category and all its products?')) return;
    
    setLoading(true);
    setError('');
    
    try {
      await apiService.deleteCategory(categoryId);
      onDataUpdate(); // Trigger refresh
    } catch (err) {
      setError('Failed to delete category: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (categoryId) => {
    if (!newProductData.name.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      await apiService.createProduct({
        categoryId,
        ...newProductData
      });
      setNewProductData({ name: '', description: '', icon: '' });
      onDataUpdate(); // Trigger refresh
    } catch (err) {
      setError('Failed to create product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProductReorder = async (categoryId, reorderedProducts) => {
    setLoading(true);
    setError('');
    
    try {
      const productOrders = reorderedProducts.map((product, index) => ({
        id: product.id,
        order: index + 1
      }));
      
      await apiService.reorderProducts(categoryId, productOrders);
      onDataUpdate(); // Trigger refresh
    } catch (err) {
      setError('Failed to reorder products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    setLoading(true);
    setError('');
    
    try {
      await apiService.deleteProduct(productId);
      onDataUpdate(); // Trigger refresh
    } catch (err) {
      setError('Failed to delete product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Bulk operation handlers
  const handleBulkModeToggle = () => {
    setBulkMode(!bulkMode);
    if (bulkMode) {
      setSelectedProducts({});
    }
  };

  const handleSelectionChange = (categoryId, selectedIds) => {
    setSelectedProducts(prev => ({
      ...prev,
      [categoryId]: selectedIds
    }));
  };

  const getSelectedCount = (categoryId) => {
    return selectedProducts[categoryId]?.length || 0;
  };

  const getAllSelectedProducts = () => {
    const allSelected = [];
    Object.entries(selectedProducts).forEach(([categoryId, productIds]) => {
      productIds.forEach(productId => {
        allSelected.push({ categoryId, productId });
      });
    });
    return allSelected;
  };

  const handleBulkDelete = async (categoryId) => {
    const selectedIds = selectedProducts[categoryId] || [];
    if (selectedIds.length === 0) return;

    setLoading(true);
    setError('');

    try {
      await apiService.bulkOperation('delete', selectedIds);
      setSelectedProducts(prev => ({ ...prev, [categoryId]: [] }));
      onDataUpdate();
    } catch (err) {
      setError('Failed to delete products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMove = async (categoryId, targetCategoryId) => {
    const selectedIds = selectedProducts[categoryId] || [];
    if (selectedIds.length === 0) return;

    setLoading(true);
    setError('');

    try {
      await apiService.bulkOperation('move', selectedIds, { targetCategoryId });
      setSelectedProducts(prev => ({ ...prev, [categoryId]: [] }));
      onDataUpdate();
    } catch (err) {
      setError('Failed to move products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEdit = async (categoryId) => {
    // For now, just show an alert. We can enhance this later with a bulk edit modal
    alert('Bulk edit feature coming soon! Select individual products to edit them one by one.');
  };

  const clearSelection = (categoryId) => {
    setSelectedProducts(prev => ({ ...prev, [categoryId]: [] }));
  };

  // Preview handlers
  const openPreviewModal = (type, data) => {
    setPreviewModal({
      isOpen: true,
      data: {
        type,
        ...data
      }
    });
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, data: null });
  };

  const handlePreviewProduct = () => {
    if (!newProductData.name.trim()) {
      setError('Please enter a product name to preview');
      return;
    }

    openPreviewModal('product', {
      product: newProductData,
      category: { name: 'Preview Category' }
    });
  };

  const handlePublishFromPreview = async () => {
    // This would normally publish the content
    // For now, just close the modal and show success
    setPreviewModal({ isOpen: false, data: null });
    // You could add actual publish logic here
  };

  const handleSaveDraft = () => {
    // Save current form data as draft
    const draftKey = `draft_${Date.now()}`;
    setDraftData(prev => ({
      ...prev,
      [draftKey]: {
        ...newProductData,
        savedAt: new Date().toISOString()
      }
    }));
    
    // Show confirmation or toast message
    alert('Draft saved successfully!');
  };

  const toggleLivePreview = (visible) => {
    setLivePreviewVisible(visible);
  };

  // Image handlers
  const handleImageUpload = async (imageData) => {
    try {
      setLoading(true);
      const response = await apiService.uploadImage(
        imageData.url,
        imageData.name,
        imageData.type
      );
      
      // Update the image with server URL
      const uploadedImage = {
        ...imageData,
        url: response.data.url,
        filename: response.data.filename
      };
      
      setProductImages(prev => [...prev, uploadedImage]);
      return uploadedImage;
    } catch (err) {
      setError('Failed to upload image: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleImageRemove = (imageId) => {
    setProductImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleImageSelect = (image) => {
    if (Array.isArray(image)) {
      setProductImages(prev => [...prev, ...image]);
    } else {
      setProductImages(prev => [...prev, image]);
    }
    setImageGalleryOpen(false);
  };

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Content Management</h2>
          <div className="header-actions">
            <button 
              onClick={() => toggleLivePreview(!livePreviewVisible)}
              className={`preview-toggle-btn ${livePreviewVisible ? 'active' : ''}`}
              title="Toggle Live Preview"
            >
              <Eye size={16} />
              {livePreviewVisible ? 'Hide Preview' : 'Live Preview'}
            </button>
            <button 
              onClick={handleBulkModeToggle}
              className={`bulk-toggle-btn ${bulkMode ? 'active' : ''}`}
            >
              {bulkMode ? 'Exit Bulk Mode' : 'Bulk Mode'}
            </button>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        </div>
        
        <div className="admin-section">
          <h3>Add New Category</h3>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="admin-input"
              disabled={loading}
            />
            <button 
              onClick={addCategory} 
              className="admin-btn primary"
              disabled={loading || !newCategoryName.trim()}
            >
              {loading ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </div>

        <div className="admin-section">
          <h3>Categories & Products</h3>
          {data.categories.map(category => (
            <div key={category.id} className="admin-category">
              <div className="admin-category-header">
                <h4>{category.name}</h4>
                <button 
                  onClick={() => deleteCategory(category.id)} 
                  className="admin-btn delete"
                >
                  Delete Category
                </button>
              </div>
              
              <div className="add-product-section">
                <div className="product-form-row">
                  <input
                    type="text"
                    placeholder="Product name"
                    value={newProductData.name}
                    onChange={(e) => setNewProductData({...newProductData, name: e.target.value})}
                    className="admin-input"
                    style={{ flex: '2' }}
                  />
                  <select
                    value={newProductData.icon}
                    onChange={(e) => setNewProductData({...newProductData, icon: e.target.value})}
                    className="admin-input"
                    style={{ flex: '0 0 120px' }}
                  >
                    <option value="">Select Icon</option>
                    <option value="cash_isa">Cash ISA</option>
                    <option value="stocks_shares_isa">Stocks & Shares ISA</option>
                    <option value="lifetime_isa">Lifetime ISA</option>
                    <option value="junior_isa">Junior ISA</option>
                    <option value="personal_pension">Personal Pension</option>
                    <option value="simple_saver">Simple Saver</option>
                    <option value="32_day_notice">32 Day Notice</option>
                    <option value="95_day_notice">95 Day Notice</option>
                    <option value="general_investment_account">General Investment Account</option>
                    <option value="open_access_cash_isa">Open Access Cash ISA</option>
                  </select>
                </div>
                <div className="rich-text-section">
                  <label className="editor-label">Product Description</label>
                  <RichTextEditor
                    value={newProductData.description}
                    onChange={(content) => setNewProductData({...newProductData, description: content})}
                    placeholder="Enter a detailed product description..."
                  />
                </div>
                
                <div className="image-section">
                  <label className="editor-label">Product Images</label>
                  <ImageUploader
                    onImageUpload={handleImageUpload}
                    existingImages={productImages}
                    onImageRemove={handleImageRemove}
                    multiple={true}
                    disabled={loading}
                  />
                  <div className="image-actions">
                    <button 
                      type="button"
                      onClick={() => setImageGalleryOpen(true)}
                      className="admin-btn secondary small"
                      disabled={loading}
                    >
                      Browse Gallery
                    </button>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    onClick={handlePreviewProduct}
                    className="admin-btn secondary"
                    disabled={!newProductData.name.trim()}
                  >
                    <Eye size={16} />
                    Preview
                  </button>
                  <button 
                    onClick={() => addProduct(category.id)} 
                    className="admin-btn primary"
                    disabled={!newProductData.name.trim()}
                  >
                    Add Product
                  </button>
                </div>
              </div>
              
              <div className="products-admin-section">
                {category.products.length > 0 ? (
                  <>
                    {/* Bulk Actions Toolbar */}
                    {bulkMode && getSelectedCount(category.id) > 0 && (
                      <BulkActionsToolbar
                        selectedCount={getSelectedCount(category.id)}
                        onBulkEdit={() => handleBulkEdit(category.id)}
                        onBulkDelete={() => handleBulkDelete(category.id)}
                        onBulkMove={(targetCategoryId) => handleBulkMove(category.id, targetCategoryId)}
                        onClearSelection={() => clearSelection(category.id)}
                        categories={data.categories.filter(c => c.id !== category.id)}
                        disabled={loading}
                      />
                    )}
                    
                    <div className="section-header">
                      <h4>{bulkMode ? 'Select products:' : 'Drag to reorder products:'}</h4>
                    </div>
                    
                    <DraggableList
                      items={category.products.sort((a, b) => (a.order || 0) - (b.order || 0))}
                      onReorder={bulkMode ? null : (reorderedProducts) => handleProductReorder(category.id, reorderedProducts)}
                      keyExtractor={(product) => product.id}
                      disabled={loading}
                      selectable={bulkMode}
                      selectedItems={selectedProducts[category.id] || []}
                      onSelectionChange={(selectedIds) => handleSelectionChange(category.id, selectedIds)}
                      renderItem={(product) => (
                        <div className="draggable-product-item">
                          <div className="product-info">
                            <span className="product-icon">{product.icon}</span>
                            <span className="product-name">{product.name}</span>
                            <span className="product-order">#{product.order || 0}</span>
                          </div>
                          {!bulkMode && (
                            <button 
                              className="admin-btn danger small"
                              onClick={() => deleteProduct(product.id)}
                              disabled={loading}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    />
                  </>
                ) : (
                  <div className="empty-products">
                    <p>No products yet. Add your first product above.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <LivePreview
        productData={newProductData}
        isVisible={livePreviewVisible}
        onToggle={toggleLivePreview}
        compact={true}
      />

      {/* Preview Modal */}
      <PreviewModal
        isOpen={previewModal.isOpen}
        onClose={closePreviewModal}
        previewData={previewModal.data}
        onPublish={handlePublishFromPreview}
        onSaveDraft={handleSaveDraft}
        loading={loading}
      />

      {/* Image Gallery Modal */}
      {imageGalleryOpen && (
        <ImageGallery
          onImageSelect={handleImageSelect}
          onClose={() => setImageGalleryOpen(false)}
          multiple={true}
        />
      )}
    </div>
  );
};

const ProductExplorer = () => {
  const [data, setData] = useState({ categories: [], metadata: {} });
  const [expandedProducts, setExpandedProducts] = useState(['stocks-shares-isa']);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiService.getCategories();
      setData(response.data);
    } catch (err) {
      setError('Failed to load categories: ' + err.message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleProductToggle = (productId) => {
    setExpandedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const navigateCategories = (direction) => {
    const totalCategories = data.categories.length;
    if (direction === 'prev') {
      setCurrentCategoryIndex(prev => prev > 0 ? prev - 1 : totalCategories - 1);
    } else {
      setCurrentCategoryIndex(prev => prev < totalCategories - 1 ? prev + 1 : 0);
    }
  };

  const getVisibleCategories = () => {
    const categories = data.categories;
    if (categories.length <= 3) return categories;
    
    const prev = categories[(currentCategoryIndex - 1 + categories.length) % categories.length];
    const current = categories[currentCategoryIndex];
    const next = categories[(currentCategoryIndex + 1) % categories.length];
    
    return [prev, current, next];
  };

  // Category edit and delete handlers
  const handleCategoryEdit = (category) => {
    // For now, show an alert. We can enhance this later with a proper edit modal
    alert(`Edit category: ${category.name}\n\nThis feature will be enhanced with a proper edit modal in the future.`);
  };

  const handleCategoryDelete = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.deleteCategory(categoryId);
      await fetchData(); // Refresh the data
    } catch (err) {
      setError('Failed to delete category: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
          --teal: #78E3DF;
          --dark-green: #022828;
          --seafoam: #E9F1EF;
          --light-teal: #A5EEEB;
          --border-color: rgba(0, 194, 180, 0.32);
        }
        
        body { 
          font-family: 'Orla Sprig Sans', BlinkMacSystemFont, -apple-system, 'Segoe UI', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; 
          background: white; 
          min-height: 100vh; 
          font-size: 18px;
          line-height: 1.4;
          color: var(--dark-green);
        }
        
        .app { 
          min-height: 100vh; 
          background: #f0f0f0;
        }
        
        .header { 
          background: #333; 
          color: white; 
          padding: 26px 0; 
          border-bottom: 1px solid #555;
          position: relative; 
          margin-bottom: 0;
        }
        
        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 26px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo { height: 40px; width: auto; }
        
        .admin-toggle { 
          background: #555; 
          border: 1px solid #777; 
          color: white; 
          padding: 8px 16px; 
          border-radius: 28px; 
          cursor: pointer; 
          transition: all 0.2s ease-out; 
          font-size: 16px;
          font-weight: 500;
          text-decoration: none;
          line-height: 50px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .admin-toggle:hover { 
          background: #666; 
          border-color: #888; 
        }
        
        .main-container { 
          background: #f0f0f0; 
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 26px;
        }
        
        .navigation-header { 
          background: #f0f0f0; 
          padding: 32px 0; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border-bottom: 1px solid #ddd; 
        }
        
        .nav-button { 
          background: #333; 
          color: white; 
          border: 1px solid #555; 
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          cursor: pointer; 
          transition: all 0.2s ease-out; 
          margin: 0 16px; 
        }
        
        .nav-button:hover { 
          background: #444; 
          border-color: #666; 
        }
        
        .nav-title { 
          font-family: 'Orla Sprig Sans';
          font-size: 32px; 
          font-weight: 500; 
          color: #333; 
          margin: 0 24px; 
          letter-spacing: 0; 
          line-height: 1;
          text-align: center;
        }
        
        .categories-container { 
          padding: 64px 0; 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 48px; 
          max-width: 1400px; 
          margin: 0 auto; 
        }
        
        .category-card { 
          background: #333; 
          border: 1px solid #555; 
          border-radius: 8px; 
          overflow: hidden; 
          transition: all 0.2s ease; 
          padding: 0;
        }
        
        .category-card:hover { 
          background: #444; 
          border-color: #666; 
        }
        
        .category-header { 
          background: #333; 
          color: white; 
          padding: 24px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 0;
          border-bottom: 1px solid #555;
        }
        
        .category-title { 
          font-family: 'Orla Sprig Sans';
          font-size: 24px; 
          font-weight: 500; 
          letter-spacing: 0; 
          color: white;
          text-align: center;
          width: 100%;
        }
        
        .admin-actions { display: flex; gap: 8px; }
        
        .admin-btn { 
          background: #555; 
          border: 1px solid #777; 
          color: white; 
          padding: 8px 16px; 
          border-radius: 28px; 
          cursor: pointer; 
          transition: all 0.2s ease-out; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 16px;
          font-weight: 500;
          text-decoration: none;
          line-height: 50px;
        }
        
        .admin-btn:hover { 
          background: #666; 
          border-color: #888; 
        }
        
        .admin-btn.delete:hover { 
          background: rgba(239,68,68,0.8); 
        }
        
        .admin-btn.primary { 
          background: var(--teal); 
          color: var(--dark-green); 
          padding: 8px 16px; 
          font-size: 16px; 
        }
        
        .admin-btn.primary:hover { 
          color: var(--teal); 
          background: var(--dark-green); 
        }
        
        .products-list { 
          padding: 24px; 
          background: #333;
        }
        
        .product-card { 
          background: #f0f0f0; 
          border: 1px solid #ddd; 
          border-radius: 6px; 
          padding: 0; 
          margin-bottom: 12px; 
          transition: all 0.2s ease; 
          cursor: pointer;
          overflow: hidden;
        }
        
        .product-card:hover { 
          background: #e8e8e8; 
          border-color: #ccc; 
        }
        
        .product-header { 
          padding: 16px 20px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          cursor: pointer; 
          transition: all 0.2s; 
          background: #f0f0f0; 
          margin-bottom: 0;
        }
        
        .product-name { 
          font-family: 'Orla Sprig Sans';
          font-weight: 500; 
          color: #333; 
          font-size: 20px; 
          letter-spacing: 0; 
        }
        
        .product-content { 
          background: #f0f0f0; 
          animation: slideDown 0.35s ease; 
          overflow: hidden; 
          border-top: 1px solid #ddd; 
        }
        
        @keyframes slideDown { 
          from { 
            max-height: 0; 
            opacity: 0; 
            transform: translateY(-10px); 
          } 
          to { 
            max-height: 500px; 
            opacity: 1; 
            transform: translateY(0); 
          } 
        }
        
        .product-details { 
          padding: 20px; 
          display: flex; 
          gap: 16px; 
          align-items: flex-start; 
        }
        
        .product-icon { 
          width: 48px; 
          height: 48px; 
          margin-right: 0;
          flex-shrink: 0;
          font-size: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .product-description { 
          font-size: 16px; 
          line-height: 1.6; 
          color: var(--dark-green); 
          flex: 1; 
        }
        
        .product-description p { margin: 0 0 16px 0; }
        .product-description p:last-child { margin-bottom: 0; }
        .product-description ul, .product-description ol { margin: 16px 0; padding-left: 24px; }
        .product-description li { margin: 8px 0; }
        .product-description a { color: var(--dark-green); text-decoration: underline; font-weight: 500; }
        .product-description a:hover { color: var(--teal); }
        .product-description strong { font-weight: bold; color: var(--dark-green); }
        
        .admin-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .admin-panel { background: white; border-radius: 12px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .admin-header { background: var(--dark-green); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .header-actions { display: flex; align-items: center; gap: 12px; }
        .preview-toggle-btn, .bulk-toggle-btn { padding: 8px 16px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .preview-toggle-btn:hover, .bulk-toggle-btn:hover { background: rgba(255,255,255,0.3); }
        .preview-toggle-btn.active { background: var(--teal); color: var(--dark-green); }
        .bulk-toggle-btn.active { background: var(--teal); color: var(--dark-green); }
        .close-btn { background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 4px; }
        .admin-section { padding: 24px; border-bottom: 1px solid #e2e8f0; }
        .admin-section h3 { margin-bottom: 16px; color: var(--dark-green); font-family: 'Orla Sprig Sans'; }
        .form-group { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .admin-input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; flex: 1; min-width: 200px; }
        .admin-input.small { min-width: 150px; }
        .admin-input.tiny { min-width: 60px; max-width: 80px; }
        .admin-category { background: var(--seafoam); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        .admin-category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .add-product-section { display: flex; flex-direction: column; gap: 16px; margin-bottom: 12px; }
        .product-form-row { display: flex; gap: 12px; align-items: center; }
        .rich-text-section { display: flex; flex-direction: column; gap: 8px; }
        .editor-label { font-size: 14px; font-weight: 500; color: var(--dark-green); }
        .form-actions { display: flex; gap: 8px; align-items: center; }
        .image-section { display: flex; flex-direction: column; gap: 8px; }
        .image-actions { display: flex; gap: 8px; margin-top: 8px; }
        .products-admin-section { margin-top: 16px; }
        .section-header { margin-bottom: 12px; }
        .section-header h4 { margin: 0; font-size: 14px; color: var(--dark-green); font-weight: 500; }
        .draggable-product-item { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .product-info { display: flex; align-items: center; gap: 8px; flex: 1; }
        .product-icon { font-size: 16px; }
        .product-name { font-weight: 500; color: var(--dark-green); flex: 1; }
        .product-order { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        .empty-products { text-align: center; padding: 20px; color: #64748b; font-style: italic; }
        .loading-message { text-align: center; padding: 40px; font-size: 16px; color: #64748b; }
        .error-message { background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; padding: 16px; border-radius: 8px; margin: 20px; text-align: center; }
        .retry-btn { background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-left: 12px; cursor: pointer; }
        .retry-btn:hover { background: #b91c1c; }
        .admin-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        @media (max-width: 1400px) {
          .categories-container { 
            grid-template-columns: repeat(3, 1fr); 
            gap: 32px; 
            padding: 64px 26px; 
          }
        }
        
        @media (max-width: 1024px) {
          .categories-container { 
            grid-template-columns: repeat(2, 1fr); 
            gap: 32px; 
            padding: 64px 26px; 
          }
        }
        
        @media (max-width: 768px) {
          .app { padding: 0; }
          .header-content { padding: 0 20px; }
          .main-container { padding: 0 20px; }
          .categories-container { 
            grid-template-columns: 1fr; 
            gap: 24px; 
            padding: 32px 0; 
          }
          .navigation-header { padding: 32px 0 24px 0; }
          .nav-title { font-size: 32px; margin: 0 20px; }
          .nav-button { width: 44px; height: 44px; }
          .category-header { padding: 24px; }
          .category-title { font-size: 20px; }
          .products-list { padding: 24px; }
          .product-header { padding: 20px; }
          .product-details { padding: 24px; gap: 16px; }
          .admin-toggle { padding: 8px 12px; font-size: 14px; }
          .logo { height: 32px; }
          .form-group { flex-direction: column; align-items: stretch; }
          .admin-input { min-width: auto; }
          .add-product-section { flex-direction: column; align-items: stretch; }
        }
      `}</style>
      
      <div className="header">
        <div className="header-content">
          <img src="/images/logos/MB-logo-400x92-1.svg" alt="Moneybox" className="logo" />
          <button 
            className="admin-toggle"
            onClick={() => setIsAdmin(!isAdmin)}
            title="Toggle Admin Mode"
          >
            <Settings size={16} />
            Admin
          </button>
        </div>
      </div>
      
      <div className="main-container">
        <div className="navigation-header">
          <button 
            className="nav-button"
            onClick={() => navigateCategories('prev')}
            aria-label="Previous categories"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="nav-title">Explore Accounts</h2>
          
          <button 
            className="nav-button"
            onClick={() => navigateCategories('next')}
            aria-label="Next categories"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="categories-container">
          {loading ? (
            <div className="loading-message">Loading categories...</div>
          ) : error ? (
            <div className="error-message">
              {error}
              <button onClick={fetchData} className="retry-btn">Retry</button>
            </div>
          ) : (
            getVisibleCategories().map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                expandedProducts={expandedProducts}
                onProductToggle={handleProductToggle}
                onEdit={handleCategoryEdit}
                onDelete={handleCategoryDelete}
                isAdmin={isAdmin}
              />
            ))
          )}
        </div>
        
        {isAdmin && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <button 
              className="admin-btn primary"
              onClick={() => setShowAdmin(true)}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              <Plus size={16} style={{ marginRight: '8px' }} />
              Manage Content
            </button>
          </div>
        )}
      </div>
      
      {showAdmin && (
        <AdminPanel
          data={data}
          onDataUpdate={fetchData}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
};

export default ProductExplorer;