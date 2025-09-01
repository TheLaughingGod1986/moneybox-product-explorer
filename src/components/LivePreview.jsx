import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const LivePreview = ({ 
  productData = {}, 
  categoryData = {}, 
  isVisible = true, 
  onToggle,
  compact = false 
}) => {
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    // Update preview content when productData changes
    if (productData.description) {
      setPreviewContent(productData.description);
    }
  }, [productData.description]);

  if (!isVisible) {
    return (
      <div className="live-preview-collapsed">
        <style>{`
          .live-preview-collapsed {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 100;
          }
          .preview-toggle-btn {
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            transition: all 0.2s;
          }
          .preview-toggle-btn:hover {
            background: #5a67d8;
            transform: scale(1.05);
          }
        `}</style>
        
        <button 
          className="preview-toggle-btn"
          onClick={() => onToggle && onToggle(true)}
          title="Show Live Preview"
        >
          <Eye size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className={`live-preview ${compact ? 'compact' : ''}`}>
      <style>{`
        .live-preview {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        .live-preview.compact {
          position: fixed;
          right: 20px;
          top: 20px;
          width: 320px;
          max-height: 400px;
          z-index: 100;
          resize: both;
          overflow: auto;
        }
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .preview-header h4 {
          margin: 0;
          font-size: 14px;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .preview-controls {
          display: flex;
          gap: 4px;
        }
        .preview-control-btn {
          padding: 4px;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .preview-control-btn:hover {
          background: #e2e8f0;
          color: #374151;
        }
        .preview-body {
          padding: 16px;
          max-height: 300px;
          overflow-y: auto;
        }
        .live-preview.compact .preview-body {
          max-height: 200px;
        }
        
        /* Product Preview Styles */
        .live-product-card {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
          background: white;
        }
        .live-product-header {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }
        .live-product-name {
          font-weight: 500;
          color: #1e293b;
          font-size: 14px;
        }
        .live-expand-icon {
          color: #64748b;
          font-size: 12px;
        }
        .live-product-content {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        .live-product-details {
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .live-product-icon {
          font-size: 24px;
          min-width: 32px;
          text-align: center;
        }
        .live-product-description {
          font-size: 13px;
          line-height: 1.5;
          color: #64748b;
          flex: 1;
        }
        .live-product-description p {
          margin: 0 0 6px 0;
        }
        .live-product-description p:last-child {
          margin-bottom: 0;
        }
        .live-product-description ul, .live-product-description ol {
          margin: 6px 0;
          padding-left: 16px;
        }
        .live-product-description li {
          margin: 2px 0;
        }
        .live-product-description a {
          color: #667eea;
          text-decoration: underline;
        }
        .live-product-description strong {
          font-weight: 600;
          color: #374151;
        }
        
        .empty-preview {
          text-align: center;
          color: #94a3b8;
          font-style: italic;
          padding: 20px;
        }
        
        .preview-updates {
          font-size: 11px;
          color: #10b981;
          padding: 4px 8px;
          background: #dcfce7;
          border-radius: 4px;
          margin-left: auto;
        }
        
        @media (max-width: 768px) {
          .live-preview.compact {
            position: relative;
            right: auto;
            top: auto;
            width: 100%;
            max-height: none;
            margin-top: 16px;
          }
        }
      `}</style>

      <div className="preview-header">
        <h4>
          <Eye size={16} />
          Live Preview
        </h4>
        
        <div className="preview-controls">
          <span className="preview-updates">●&nbsp;Live</span>
          {onToggle && (
            <button 
              className="preview-control-btn"
              onClick={() => onToggle(false)}
              title="Hide Preview"
            >
              <EyeOff size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="preview-body">
        {productData.name || productData.description ? (
          <div className="live-product-card">
            <div className="live-product-header">
              <span className="live-product-name">
                {productData.name || 'Product Name'}
              </span>
              <span className="live-expand-icon">▼</span>
            </div>
            
            <div className="live-product-content">
              <div className="live-product-details">
                <div className="live-product-icon">
                  {productData.icon || '💼'}
                </div>
                <div 
                  className="live-product-description"
                  dangerouslySetInnerHTML={{ 
                    __html: productData.description || '<em>Start typing to see your content preview...</em>' 
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-preview">
            Start adding content to see live preview
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;
