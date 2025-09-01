import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, FileImage, Loader, AlertCircle } from 'lucide-react';

const ImageUploader = ({ 
  onImageUpload, 
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  multiple = false,
  existingImages = [],
  onImageRemove,
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  }, [disabled]);

  // Handle file input change
  const handleChange = useCallback((e) => {
    e.preventDefault();
    if (disabled) return;

    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  }, [disabled]);

  // Process files
  const handleFiles = async (files) => {
    setError('');
    setUploading(true);

    try {
      const validFiles = [];
      
      for (const file of files) {
        // Validate file type
        if (!acceptedTypes.includes(file.type)) {
          throw new Error(`File type ${file.type} not supported`);
        }
        
        // Validate file size
        if (file.size > maxSize) {
          throw new Error(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
        }
        
        validFiles.push(file);
      }

      // Process each valid file
      for (const file of validFiles) {
        await processImage(file);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Process and upload image
  const processImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const img = new Image();
          img.onload = async () => {
            // Create canvas for optimization
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate optimal dimensions (max 1200px width)
            const maxWidth = 1200;
            const maxHeight = 800;
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(async (blob) => {
              try {
                const optimizedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });

                // Create image data object
                const imageData = {
                  id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  name: file.name,
                  size: optimizedFile.size,
                  type: file.type,
                  url: canvas.toDataURL(file.type, 0.85),
                  file: optimizedFile,
                  originalSize: file.size,
                  dimensions: { width, height },
                  uploadedAt: new Date().toISOString()
                };

                if (onImageUpload) {
                  await onImageUpload(imageData);
                }
                
                resolve(imageData);
              } catch (error) {
                reject(error);
              }
            }, file.type, 0.85);
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target.result;
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Open file dialog
  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="image-uploader">
      <style>{`
        .image-uploader {
          width: 100%;
        }
        .upload-zone {
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          padding: 32px 16px;
          text-align: center;
          background: #f8fafc;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          min-height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .upload-zone:hover:not(.disabled) {
          border-color: #667eea;
          background: #f0f4ff;
        }
        .upload-zone.drag-active {
          border-color: #667eea;
          background: #f0f4ff;
          transform: scale(1.02);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
        }
        .upload-zone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f1f5f9;
        }
        .upload-zone.uploading {
          pointer-events: none;
        }
        .upload-icon {
          color: #94a3b8;
          margin-bottom: 12px;
          transition: color 0.3s ease;
        }
        .upload-zone:hover:not(.disabled) .upload-icon {
          color: #667eea;
        }
        .upload-text {
          font-size: 16px;
          color: #475569;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .upload-hint {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 16px;
        }
        .upload-button {
          padding: 8px 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .upload-button:hover:not(:disabled) {
          background: #5a67d8;
          transform: translateY(-1px);
        }
        .upload-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .file-input {
          display: none;
        }
        .error-message {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #dc2626;
          background: #fee2e2;
          border: 1px solid #fecaca;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          margin-top: 12px;
        }
        .uploading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }
        .uploading-text {
          margin-top: 8px;
          color: #667eea;
          font-weight: 500;
        }
        .image-gallery {
          margin-top: 16px;
        }
        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .gallery-title {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        .image-count {
          font-size: 12px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }
        .image-item {
          position: relative;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
          aspect-ratio: 1;
          cursor: pointer;
          transition: all 0.2s;
        }
        .image-item:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
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
        .image-item:hover .image-overlay {
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
          position: absolute;
          bottom: 4px;
          left: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 6px;
          font-size: 10px;
          border-radius: 3px;
          text-align: center;
        }
        .empty-gallery {
          text-align: center;
          color: #94a3b8;
          font-style: italic;
          padding: 20px;
        }
        @media (max-width: 768px) {
          .upload-zone {
            padding: 24px 12px;
            min-height: 120px;
          }
          .image-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 8px;
          }
        }
      `}</style>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {uploading && (
          <div className="uploading-overlay">
            <Loader size={32} className="animate-spin" style={{ color: '#667eea' }} />
            <div className="uploading-text">Processing images...</div>
          </div>
        )}

        <Upload size={48} className="upload-icon" />
        <div className="upload-text">
          {dragActive ? 'Drop images here' : 'Drag & drop images here'}
        </div>
        <div className="upload-hint">
          Supports JPG, PNG, GIF, WebP up to {Math.round(maxSize / 1024 / 1024)}MB
        </div>
        <button 
          className="upload-button" 
          disabled={disabled || uploading}
          onClick={(e) => e.stopPropagation()}
        >
          <FileImage size={16} />
          Choose Files
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Image Gallery */}
      {existingImages.length > 0 && (
        <div className="image-gallery">
          <div className="gallery-header">
            <div className="gallery-title">Uploaded Images</div>
            <div className="image-count">{existingImages.length} image{existingImages.length !== 1 ? 's' : ''}</div>
          </div>
          
          <div className="image-grid">
            {existingImages.map((image) => (
              <div key={image.id} className="image-item">
                <img 
                  src={image.url} 
                  alt={image.name}
                  className="image-preview"
                />
                <div className="image-overlay">
                  <div className="image-actions">
                    {onImageRemove && (
                      <button 
                        className="image-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageRemove(image.id);
                        }}
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="image-info">
                  {formatFileSize(image.size)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
