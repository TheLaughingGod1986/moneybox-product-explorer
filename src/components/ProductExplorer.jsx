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
  return (
    <div className="product-card">
      <div className="product-header" onClick={onToggle}>
        <span className="product-name">{product.name}</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {isExpanded && (
        <div className="product-content">
          <div className="product-details">
            <div className="product-icon">{product.icon}</div>
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
        <h3 className="category-title">{category.name}</h3>
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
  const [newProductData, setNewProductData] = useState({ name: '', description: '', icon: '💼' });
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
      setNewProductData({ name: '', description: '', icon: '💼' });
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
                  <input
                    type="text"
                    placeholder="Icon (emoji)"
                    value={newProductData.icon}
                    onChange={(e) => setNewProductData({...newProductData, icon: e.target.value})}
                    className="admin-input"
                    style={{ flex: '0 0 80px' }}
                  />
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

  return (
    <div className="app">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; }
        .app { min-height: 100vh; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative; }
        .header h1 { font-size: 28px; font-weight: 300; letter-spacing: 1px; }
        .admin-toggle { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        .admin-toggle:hover { background: rgba(255,255,255,0.3); }
        .main-container { background: white; border-radius: 0 0 12px 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden; }
        .navigation-header { background: #f8fafc; padding: 30px 20px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #e2e8f0; }
        .nav-button { background: #64748b; color: white; border: none; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; margin: 0 20px; }
        .nav-button:hover { background: #475569; transform: translateY(-1px); }
        .nav-title { font-size: 24px; font-weight: 600; color: #1e293b; margin: 0 40px; }
        .categories-container { padding: 40px 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto; }
        .category-card { background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #e2e8f0; }
        .category-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
        .category-header { background: linear-gradient(135deg, #64748b 0%, #475569 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .category-title { font-size: 18px; font-weight: 600; letter-spacing: 0.5px; }
        .admin-actions { display: flex; gap: 8px; }
        .admin-btn { background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px; border-radius: 4px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center; }
        .admin-btn:hover { background: rgba(255,255,255,0.3); }
        .admin-btn.delete:hover { background: rgba(239,68,68,0.8); }
        .admin-btn.primary { background: #3b82f6; color: white; padding: 8px 16px; font-size: 14px; }
        .admin-btn.primary:hover { background: #2563eb; }
        .products-list { padding: 0; }
        .product-card { border-bottom: 1px solid #f1f5f9; }
        .product-card:last-child { border-bottom: none; }
        .product-header { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s; background: white; }
        .product-header:hover { background: #f8fafc; }
        .product-name { font-weight: 500; color: #1e293b; font-size: 15px; }
        .product-content { background: #f8fafc; animation: slideDown 0.3s ease-out; overflow: hidden; }
        @keyframes slideDown { from { max-height: 0; opacity: 0; } to { max-height: 200px; opacity: 1; } }
        .product-details { padding: 20px; display: flex; gap: 16px; align-items: flex-start; }
        .product-icon { font-size: 32px; min-width: 50px; text-align: center; }
        .product-description { font-size: 14px; line-height: 1.6; color: #64748b; flex: 1; }
        .product-description p { margin: 0 0 8px 0; }
        .product-description p:last-child { margin-bottom: 0; }
        .product-description ul, .product-description ol { margin: 8px 0; padding-left: 20px; }
        .product-description li { margin: 4px 0; }
        .product-description a { color: #667eea; text-decoration: underline; }
        .product-description strong { font-weight: 600; }
        .admin-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .admin-panel { background: white; border-radius: 12px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .admin-header { background: #1e293b; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .header-actions { display: flex; align-items: center; gap: 12px; }
        .preview-toggle-btn, .bulk-toggle-btn { padding: 8px 16px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .preview-toggle-btn:hover, .bulk-toggle-btn:hover { background: rgba(255,255,255,0.3); }
        .preview-toggle-btn.active { background: #667eea; }
        .bulk-toggle-btn.active { background: #10b981; }
        .close-btn { background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 4px; }
        .admin-section { padding: 24px; border-bottom: 1px solid #e2e8f0; }
        .admin-section h3 { margin-bottom: 16px; color: #1e293b; }
        .form-group { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .admin-input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; flex: 1; min-width: 200px; }
        .admin-input.small { min-width: 150px; }
        .admin-input.tiny { min-width: 60px; max-width: 80px; }
        .admin-category { background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        .admin-category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .add-product-section { display: flex; flex-direction: column; gap: 16px; margin-bottom: 12px; }
        .product-form-row { display: flex; gap: 12px; align-items: center; }
        .rich-text-section { display: flex; flex-direction: column; gap: 8px; }
        .editor-label { font-size: 14px; font-weight: 500; color: #374151; }
        .form-actions { display: flex; gap: 8px; align-items: center; }
        .image-section { display: flex; flex-direction: column; gap: 8px; }
        .image-actions { display: flex; gap: 8px; margin-top: 8px; }
        .products-admin-section { margin-top: 16px; }
        .section-header { margin-bottom: 12px; }
        .section-header h4 { margin: 0; font-size: 14px; color: #374151; font-weight: 500; }
        .draggable-product-item { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .product-info { display: flex; align-items: center; gap: 8px; flex: 1; }
        .product-icon { font-size: 16px; }
        .product-name { font-weight: 500; color: #1e293b; flex: 1; }
        .product-order { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        .empty-products { text-align: center; padding: 20px; color: #64748b; font-style: italic; }
        .loading-message { text-align: center; padding: 40px; font-size: 16px; color: #64748b; }
        .error-message { background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; padding: 16px; border-radius: 8px; margin: 20px; text-align: center; }
        .retry-btn { background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-left: 12px; cursor: pointer; }
        .retry-btn:hover { background: #b91c1c; }
        .admin-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 768px) {
          .categories-container { grid-template-columns: 1fr; gap: 20px; padding: 20px; }
          .navigation-header { padding: 20px; }
          .nav-title { font-size: 20px; margin: 0 20px; }
          .form-group { flex-direction: column; align-items: stretch; }
          .admin-input { min-width: auto; }
          .add-product-section { flex-direction: column; align-items: stretch; }
        }
      `}</style>
      
      <div className="header">
        <h1>Moneybox</h1>
        <button 
          className="admin-toggle"
          onClick={() => setIsAdmin(!isAdmin)}
          title="Toggle Admin Mode"
        >
          <Settings size={16} />
        </button>
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
                onEdit={() => {}}
                onDelete={() => {}}
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