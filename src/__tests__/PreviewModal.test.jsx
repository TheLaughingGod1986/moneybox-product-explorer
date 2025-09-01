import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PreviewModal from '../components/PreviewModal';

const mockPreviewData = {
  product: {
    name: 'Test Product',
    description: '<p>This is a <strong>test</strong> product description.</p>',
    icon: '💼'
  },
  category: {
    name: 'Test Category'
  }
};

describe('PreviewModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PreviewModal
        isOpen={false}
        onClose={() => {}}
        previewData={mockPreviewData}
        onPublish={() => {}}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders when isOpen is true', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        previewData={mockPreviewData}
        onPublish={() => {}}
      />
    );

    expect(screen.getByText('Preview Content')).toBeInTheDocument();
  });

  it('renders product preview correctly', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        previewData={mockPreviewData}
        onPublish={() => {}}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('💼')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    
    render(
      <PreviewModal
        isOpen={true}
        onClose={mockOnClose}
        previewData={mockPreviewData}
        onPublish={() => {}}
      />
    );

    fireEvent.click(screen.getByTitle('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onPublish when publish button is clicked', () => {
    const mockOnPublish = vi.fn();
    
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        previewData={mockPreviewData}
        onPublish={mockOnPublish}
      />
    );

    fireEvent.click(screen.getByText('Update'));
    expect(mockOnPublish).toHaveBeenCalled();
  });

  it('shows draft indicator when isDraft is true', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        previewData={mockPreviewData}
        onPublish={() => {}}
        isDraft={true}
      />
    );

    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });

  it('shows save draft button when onSaveDraft is provided', () => {
    const mockOnSaveDraft = vi.fn();
    
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        previewData={mockPreviewData}
        onPublish={() => {}}
        onSaveDraft={mockOnSaveDraft}
      />
    );

    expect(screen.getByText('Save Draft')).toBeInTheDocument();
  });

  it('changes viewport when viewport buttons are clicked', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        previewData={mockPreviewData}
        onPublish={() => {}}
      />
    );

    const mobileBtn = screen.getByText('Mobile');
    const tabletBtn = screen.getByText('Tablet');
    const desktopBtn = screen.getByText('Desktop');

    expect(desktopBtn).toHaveClass('active');
    
    fireEvent.click(mobileBtn);
    expect(mobileBtn).toHaveClass('active');
    expect(desktopBtn).not.toHaveClass('active');

    fireEvent.click(tabletBtn);
    expect(tabletBtn).toHaveClass('active');
    expect(mobileBtn).not.toHaveClass('active');
  });

  it('disables buttons when loading is true', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        previewData={mockPreviewData}
        onPublish={() => {}}
        onSaveDraft={() => {}}
        loading={true}
      />
    );

    expect(screen.getByText('Update')).toBeDisabled();
    expect(screen.getByText('Save Draft')).toBeDisabled();
  });

  it('renders HTML content safely in description', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        previewData={mockPreviewData}
        onPublish={() => {}}
      />
    );

    // The HTML should be rendered but we can check for the text content
    expect(screen.getByText(/This is a.*test.*product description/)).toBeInTheDocument();
  });
});
