import React, { useState, useEffect } from 'react';
import { Image, Search, Grid, List, Eye, Trash2, Download, Plus, X } from 'lucide-react';
import { apiService } from '../services/api.js';

const ImageGallery = ({ 
  onImageSelect, 
  onClose, 
  multiple = false,
  selectedImages = [] 
}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedImageIds, setSelectedImageIds] = useState(selectedImages);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getImages();
      setImages(response.data.images || []);
    } catch (err) {
      setError('Failed to load images: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (image) => {
    if (multiple) {
      const isSelected = selectedImageIds.includes(image.id);
      if (isSelected) {
        setSelectedImageIds(prev => prev.filter(id => id !== image.id));
      } else {
        setSelectedImageIds(prev => [...prev, image.id]);
      }
    } else {
      if (onImageSelect) {
        onImageSelect(image);
      }
      if (onClose) {
        onClose();
      }
    }
  };

  const handleDeleteImage = async (image) => {
    if (!window.confirm(`Are you sure you want to delete "${image.filename}"?`)) {
      return;
    }

    try {
      await apiService.deleteImage(image.filename);
      setImages(prev => prev.filter(img => img.id !== image.id));
      setSelectedImageIds(prev => prev.filter(id => id !== image.id));
    } catch (err) {
      setError('Failed to delete image: ' + err.message);
    }
  };

  const handleSelectAll = () => {
    if (selectedImageIds.length === filteredImages.length) {
      setSelectedImageIds([]);
    } else {
      setSelectedImageIds(filteredImages.map(img => img.id));
    }
  };

  const handleConfirmSelection = () => {
    const selectedImagesData = images.filter(img => selectedImageIds.includes(img.id));
    if (onImageSelect) {
      onImageSelect(multiple ? selectedImagesData : selectedImagesData[0]);
    }
    if (onClose) {
      onClose();
    }
  };

  const downloadImage = (image) => {
    const link = document.createElement('a');
    link.href = `http://localhost:3002${image.url}`;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredImages = images.filter(image =>
    image.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="image-gallery-modal">
      <style>{`
        .image-gallery-modal {
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
        .gallery-container {
          background: white;
          border-radius: 12px;
          width: 95%;
          max-width: 1000px;
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
        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 12px 12px 0 0;
        }
        .gallery-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #1e293b;
        }
        .gallery-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;
          min-width: 200px;
        }
        .search-input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 14px;
        }
        .view-toggle {
          display: flex;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }
        .view-btn {
          padding: 8px;
          border: none;
          background: white;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }
        .view-btn.active {
          background: #667eea;
          color: white;
        }
        .close-gallery-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .close-gallery-btn:hover {
          background: #f1f5f9;
        }
        .gallery-body {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .gallery-toolbar {
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
        }
        .gallery-info {
          font-size: 14px;
          color: #64748b;
        }
        .selection-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .action-btn {
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .action-btn:hover {
          background: #f8fafc;
        }
        .action-btn.primary {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
        .action-btn.primary:hover {
          background: #5a67d8;
        }
        .gallery-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }
        .images-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .image-card {
          position: relative;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }
        .image-card:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }
        .image-card.selected {
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
        }
        .image-preview-container {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
        }
        .image-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .image-card:hover .image-overlay {
          opacity: 1;
        }
        .image-actions {
          display: flex;
          gap: 8px;
        }
        .image-action-btn {
          padding: 6px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }
        .image-action-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .image-info {
          padding: 12px;
        }
        .image-name {
          font-size: 13px;
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 4px;
          word-break: break-all;
        }
        .image-meta {
          font-size: 11px;
          color: #64748b;
          display: flex;
          justify-content: space-between;
        }
        .list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .list-item:hover {
          border-color: #667eea;
          background: #f8fafc;
        }
        .list-item.selected {
          border-color: #667eea;
          background: #f0f4ff;
        }
        .list-thumbnail {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 4px;
        }
        .list-info {
          flex: 1;
        }
        .list-name {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 2px;
        }
        .list-meta {
          font-size: 12px;
          color: #64748b;
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #64748b;
        }
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #dc2626;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #94a3b8;
        }
        .selection-checkbox {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 20px;
          height: 20px;
          cursor: pointer;
          z-index: 10;
        }
        @media (max-width: 768px) {
          .gallery-container {
            width: 100%;
            height: 100vh;
            border-radius: 0;
          }
          .images-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
          }
          .gallery-controls {
            flex-direction: column;
            gap: 8px;
          }
          .search-box {
            min-width: 100%;
          }
        }
      `}</style>

      <div className="gallery-container">
        <div className="gallery-header">
          <div className="gallery-title">
            <Image size={20} />
            Image Gallery
          </div>
          
          <div className="gallery-controls">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                className="search-input"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={16} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </button>
            </div>

            <button className="close-gallery-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="gallery-body">
          <div className="gallery-toolbar">
            <div className="gallery-info">
              {filteredImages.length} of {images.length} images
              {multiple && selectedImageIds.length > 0 && (
                <span> • {selectedImageIds.length} selected</span>
              )}
            </div>
            
            <div className="selection-actions">
              {multiple && filteredImages.length > 0 && (
                <>
                  <button className="action-btn" onClick={handleSelectAll}>
                    {selectedImageIds.length === filteredImages.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedImageIds.length > 0 && (
                    <button className="action-btn primary" onClick={handleConfirmSelection}>
                      <Plus size={14} />
                      Use Selected ({selectedImageIds.length})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="gallery-content">
            {loading ? (
              <div className="loading-state">
                <div>Loading images...</div>
              </div>
            ) : error ? (
              <div className="error-state">
                <div>{error}</div>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="empty-state">
                <Image size={48} style={{ marginBottom: '12px' }} />
                <div>No images found</div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="images-grid">
                {filteredImages.map((image) => (
                  <div 
                    key={image.id} 
                    className={`image-card ${selectedImageIds.includes(image.id) ? 'selected' : ''}`}
                    onClick={() => handleImageSelect(image)}
                  >
                    {multiple && (
                      <input
                        type="checkbox"
                        className="selection-checkbox"
                        checked={selectedImageIds.includes(image.id)}
                        onChange={() => handleImageSelect(image)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    
                    <div className="image-preview-container">
                      <img 
                        src={`http://localhost:3002${image.url}`} 
                        alt={image.filename}
                        className="image-preview"
                      />
                      <div className="image-overlay">
                        <div className="image-actions">
                          <button 
                            className="image-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(image);
                            }}
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="image-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadImage(image);
                            }}
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            className="image-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(image);
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="image-info">
                      <div className="image-name">{image.filename}</div>
                      <div className="image-meta">
                        <span>{formatFileSize(image.size)}</span>
                        <span>{formatDate(image.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="images-list">
                {filteredImages.map((image) => (
                  <div 
                    key={image.id} 
                    className={`list-item ${selectedImageIds.includes(image.id) ? 'selected' : ''}`}
                    onClick={() => handleImageSelect(image)}
                  >
                    {multiple && (
                      <input
                        type="checkbox"
                        checked={selectedImageIds.includes(image.id)}
                        onChange={() => handleImageSelect(image)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    
                    <img 
                      src={`http://localhost:3002${image.url}`} 
                      alt={image.filename}
                      className="list-thumbnail"
                    />
                    
                    <div className="list-info">
                      <div className="list-name">{image.filename}</div>
                      <div className="list-meta">
                        {formatFileSize(image.size)} • {formatDate(image.uploadedAt)}
                      </div>
                    </div>
                    
                    <div className="image-actions">
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image);
                        }}
                      >
                        <Download size={14} />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="image-gallery-modal" 
          style={{ zIndex: 2100 }}
          onClick={() => setPreviewImage(null)}
        >
          <div style={{ 
            maxWidth: '90%', 
            maxHeight: '90%', 
            background: 'white', 
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              padding: '16px', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: '500' }}>{previewImage.filename}</div>
              <button 
                onClick={() => setPreviewImage(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <img 
              src={`http://localhost:3002${previewImage.url}`}
              alt={previewImage.filename}
              style={{ 
                maxWidth: '100%', 
                maxHeight: 'calc(90vh - 100px)', 
                objectFit: 'contain'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
