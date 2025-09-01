import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ImageUploader from '../components/ImageUploader';

// Mock the Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
}));

HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  callback(new Blob(['fake-image-data'], { type: 'image/jpeg' }));
});

describe('ImageUploader', () => {
  it('renders upload zone with correct text', () => {
    render(
      <ImageUploader
        onImageUpload={() => {}}
      />
    );

    expect(screen.getByText('Drag & drop images here')).toBeInTheDocument();
    expect(screen.getByText('Choose Files')).toBeInTheDocument();
  });

  it('shows drag active state when dragging over', () => {
    render(
      <ImageUploader
        onImageUpload={() => {}}
      />
    );

    const uploadZone = document.querySelector('.upload-zone');
    
    fireEvent.dragEnter(uploadZone);
    expect(uploadZone).toHaveClass('drag-active');
    
    fireEvent.dragLeave(uploadZone);
    expect(uploadZone).not.toHaveClass('drag-active');
  });

  it('opens file dialog when choose files button is clicked', () => {
    render(
      <ImageUploader
        onImageUpload={() => {}}
      />
    );

    const fileInput = document.querySelector('.file-input');
    const clickSpy = vi.spyOn(fileInput, 'click');
    
    fireEvent.click(screen.getByText('Choose Files'));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('displays existing images in gallery', () => {
    const existingImages = [
      {
        id: 'img1',
        name: 'test.jpg',
        url: 'data:image/jpeg;base64,fake',
        size: 1024
      }
    ];

    render(
      <ImageUploader
        onImageUpload={() => {}}
        existingImages={existingImages}
      />
    );

    expect(screen.getByText('Uploaded Images')).toBeInTheDocument();
    expect(screen.getByText('1 image')).toBeInTheDocument();
  });

  it('calls onImageRemove when remove button is clicked', () => {
    const mockOnImageRemove = vi.fn();
    const existingImages = [
      {
        id: 'img1',
        name: 'test.jpg',
        url: 'data:image/jpeg;base64,fake',
        size: 1024
      }
    ];

    render(
      <ImageUploader
        onImageUpload={() => {}}
        existingImages={existingImages}
        onImageRemove={mockOnImageRemove}
      />
    );

    const removeButton = screen.getByTitle('Remove image');
    fireEvent.click(removeButton);
    
    expect(mockOnImageRemove).toHaveBeenCalledWith('img1');
  });

  it('displays error message when provided', () => {
    render(
      <ImageUploader
        onImageUpload={() => {}}
      />
    );

    // Simulate file size error
    const uploadZone = document.querySelector('.upload-zone');
    const mockFile = new File(['a'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(mockFile, 'size', {
      value: 10 * 1024 * 1024, // 10MB
      writable: false
    });

    const mockDataTransfer = {
      files: [mockFile]
    };

    fireEvent.drop(uploadZone, { dataTransfer: mockDataTransfer });

    // Wait for error to appear
    waitFor(() => {
      expect(screen.getByText(/File size exceeds/)).toBeInTheDocument();
    });
  });

  it('shows disabled state when disabled prop is true', () => {
    render(
      <ImageUploader
        onImageUpload={() => {}}
        disabled={true}
      />
    );

    const uploadZone = document.querySelector('.upload-zone');
    expect(uploadZone).toHaveClass('disabled');
    
    const chooseButton = screen.getByText('Choose Files');
    expect(chooseButton).toBeDisabled();
  });

  it('accepts multiple files when multiple prop is true', () => {
    render(
      <ImageUploader
        onImageUpload={() => {}}
        multiple={true}
      />
    );

    const fileInput = document.querySelector('.file-input');
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('formats file size correctly', () => {
    const existingImages = [
      {
        id: 'img1',
        name: 'test.jpg',
        url: 'data:image/jpeg;base64,fake',
        size: 1536 // 1.5 KB
      }
    ];

    render(
      <ImageUploader
        onImageUpload={() => {}}
        existingImages={existingImages}
      />
    );

    expect(screen.getByText('1.5 KB')).toBeInTheDocument();
  });

  it('shows uploading state when processing files', () => {
    const mockOnImageUpload = vi.fn(() => new Promise(() => {})); // Never resolves
    
    render(
      <ImageUploader
        onImageUpload={mockOnImageUpload}
      />
    );

    const uploadZone = document.querySelector('.upload-zone');
    const mockFile = new File(['fake-content'], 'test.jpg', { type: 'image/jpeg' });
    
    const mockDataTransfer = {
      files: [mockFile]
    };

    fireEvent.drop(uploadZone, { dataTransfer: mockDataTransfer });

    waitFor(() => {
      expect(screen.getByText('Processing images...')).toBeInTheDocument();
      expect(uploadZone).toHaveClass('uploading');
    });
  });
});
