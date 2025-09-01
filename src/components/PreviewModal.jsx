import React, { useState } from 'react';
import { X, Eye, Edit, Smartphone, Monitor, Tablet, ExternalLink } from 'lucide-react';

const PreviewModal = ({ 
  isOpen, 
  onClose, 
  previewData, 
  onPublish, 
  onSaveDraft,
  isDraft = false,
  loading = false 
}) => {
  const [viewMode, setViewMode] = useState('desktop'); // desktop, tablet, mobile
  const [previewType, setPreviewType] = useState('product'); // product, category

  if (!isOpen || !previewData) return null;

  const getViewportWidth = () => {
    switch (viewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
      default: return '100%';
    }
  };

  const renderProductPreview = () => {
    const { product, category } = previewData;
    
    return (
      <div className="product-preview">
        <div className="category-header">
          <h2>{category?.name || 'Category'}</h2>
        </div>
        
        <div className="product-card-preview">
          <div className="product-header-preview">
            <span className="product-name-preview">{product.name}</span>
            <span className="expand-icon">▼</span>
          </div>
          
          <div className="product-content-preview">
            <div className="product-details-preview">
              <div className="product-icon-preview">{product.icon}</div>
              <div 
                className="product-description-preview"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryPreview = () => {
    const { category } = previewData;
    
    return (
      <div className="category-preview">
        <div className="categories-nav-preview">
          <div className="category-button-preview active">
            {category.name}
          </div>
          <div className="category-button-preview">Other Category</div>
        </div>
        
        <div className="category-content-preview">
          <h2>{category.name}</h2>
          <p>This category will contain {category.products?.length || 0} products.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="preview-modal-overlay">
      <style>{`
        .preview-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .preview-modal {
          background: white;
          border-radius: 12px;
          width: 95%;
          max-width: 1200px;
          height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 12px 12px 0 0;
        }
        .preview-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #1e293b;
        }
        .preview-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .viewport-controls {
          display: flex;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }
        .viewport-btn {
          padding: 8px 12px;
          border: none;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #64748b;
          transition: all 0.2s;
        }
        .viewport-btn.active {
          background: #667eea;
          color: white;
        }
        .viewport-btn:hover:not(.active) {
          background: #f1f5f9;
        }
        .preview-actions {
          display: flex;
          gap: 8px;
        }
        .preview-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .preview-btn.primary {
          background: #667eea;
          color: white;
        }
        .preview-btn.primary:hover {
          background: #5a67d8;
        }
        .preview-btn.secondary {
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .preview-btn.secondary:hover {
          background: #f8fafc;
        }
        .preview-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .close-preview-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .close-preview-btn:hover {
          background: #f1f5f9;
        }
        .preview-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 24px;
          background: #f8fafc;
        }
        .preview-viewport {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
          max-height: 100%;
          overflow-y: auto;
        }
        .preview-device-frame {
          width: ${getViewportWidth()};
          min-height: 400px;
          transition: width 0.3s ease;
        }
        
        /* Preview Content Styles */
        .product-preview {
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .category-header {
          margin-bottom: 20px;
        }
        .category-header h2 {
          margin: 0;
          color: #1e293b;
          font-size: 24px;
          font-weight: 600;
        }
        .product-card-preview {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .product-header-preview {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }
        .product-name-preview {
          font-weight: 500;
          color: #1e293b;
          font-size: 15px;
        }
        .expand-icon {
          color: #64748b;
        }
        .product-content-preview {
          background: #f8fafc;
        }
        .product-details-preview {
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .product-icon-preview {
          font-size: 32px;
          min-width: 50px;
          text-align: center;
        }
        .product-description-preview {
          font-size: 14px;
          line-height: 1.6;
          color: #64748b;
          flex: 1;
        }
        .product-description-preview p {
          margin: 0 0 8px 0;
        }
        .product-description-preview p:last-child {
          margin-bottom: 0;
        }
        .product-description-preview ul, .product-description-preview ol {
          margin: 8px 0;
          padding-left: 20px;
        }
        .product-description-preview li {
          margin: 4px 0;
        }
        .product-description-preview a {
          color: #667eea;
          text-decoration: underline;
        }
        .product-description-preview strong {
          font-weight: 600;
        }
        
        .category-preview {
          padding: 20px;
        }
        .categories-nav-preview {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          overflow-x: auto;
          padding: 8px 0;
        }
        .category-button-preview {
          padding: 8px 16px;
          background: #f1f5f9;
          border-radius: 20px;
          font-size: 14px;
          color: #64748b;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
        }
        .category-button-preview.active {
          background: #667eea;
          color: white;
        }
        .category-content-preview h2 {
          margin: 0 0 12px 0;
          color: #1e293b;
          font-size: 24px;
          font-weight: 600;
        }
        
        .draft-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #fbbf24;
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .preview-modal {
            width: 100%;
            height: 100vh;
            border-radius: 0;
          }
          .preview-header {
            padding: 16px;
          }
          .viewport-controls {
            display: none;
          }
          .preview-content {
            padding: 16px;
          }
        }
      `}</style>

      <div className="preview-modal">
        <div className="preview-header">
          <div className="preview-title">
            <Eye size={20} />
            Preview Content
            {isDraft && <span className="draft-indicator">DRAFT</span>}
          </div>
          
          <div className="preview-controls">
            <div className="viewport-controls">
              <button 
                className={`viewport-btn ${viewMode === 'mobile' ? 'active' : ''}`}
                onClick={() => setViewMode('mobile')}
              >
                <Smartphone size={14} />
                Mobile
              </button>
              <button 
                className={`viewport-btn ${viewMode === 'tablet' ? 'active' : ''}`}
                onClick={() => setViewMode('tablet')}
              >
                <Tablet size={14} />
                Tablet
              </button>
              <button 
                className={`viewport-btn ${viewMode === 'desktop' ? 'active' : ''}`}
                onClick={() => setViewMode('desktop')}
              >
                <Monitor size={14} />
                Desktop
              </button>
            </div>

            <div className="preview-actions">
              {onSaveDraft && (
                <button 
                  className="preview-btn secondary"
                  onClick={onSaveDraft}
                  disabled={loading}
                >
                  <Edit size={16} />
                  Save Draft
                </button>
              )}
              
              <button 
                className="preview-btn primary"
                onClick={onPublish}
                disabled={loading}
              >
                <ExternalLink size={16} />
                {isDraft ? 'Publish' : 'Update'}
              </button>
            </div>

            <button className="close-preview-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="preview-content">
          <div className="preview-viewport">
            <div className="preview-device-frame">
              {previewType === 'product' ? renderProductPreview() : renderCategoryPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
