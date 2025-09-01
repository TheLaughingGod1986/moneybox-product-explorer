import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BulkActionsToolbar from '../components/BulkActionsToolbar';

const mockCategories = [
  { id: 'cat1', name: 'Category 1' },
  { id: 'cat2', name: 'Category 2' },
];

describe('BulkActionsToolbar', () => {
  it('does not render when selectedCount is 0', () => {
    const { container } = render(
      <BulkActionsToolbar
        selectedCount={0}
        onBulkEdit={() => {}}
        onBulkDelete={() => {}}
        onBulkMove={() => {}}
        onClearSelection={() => {}}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders with correct selected count', () => {
    render(
      <BulkActionsToolbar
        selectedCount={3}
        onBulkEdit={() => {}}
        onBulkDelete={() => {}}
        onBulkMove={() => {}}
        onClearSelection={() => {}}
      />
    );

    expect(screen.getByText('3 products selected')).toBeInTheDocument();
  });

  it('renders singular form for single product', () => {
    render(
      <BulkActionsToolbar
        selectedCount={1}
        onBulkEdit={() => {}}
        onBulkDelete={() => {}}
        onBulkMove={() => {}}
        onClearSelection={() => {}}
      />
    );

    expect(screen.getByText('1 product selected')).toBeInTheDocument();
  });

  it('calls onBulkEdit when edit button is clicked', () => {
    const mockOnBulkEdit = vi.fn();
    
    render(
      <BulkActionsToolbar
        selectedCount={2}
        onBulkEdit={mockOnBulkEdit}
        onBulkDelete={() => {}}
        onBulkMove={() => {}}
        onClearSelection={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnBulkEdit).toHaveBeenCalled();
  });

  it('shows move button when categories are provided', () => {
    render(
      <BulkActionsToolbar
        selectedCount={2}
        onBulkEdit={() => {}}
        onBulkDelete={() => {}}
        onBulkMove={() => {}}
        onClearSelection={() => {}}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('Move')).toBeInTheDocument();
  });

  it('does not show move button when no categories provided', () => {
    render(
      <BulkActionsToolbar
        selectedCount={2}
        onBulkEdit={() => {}}
        onBulkDelete={() => {}}
        onBulkMove={() => {}}
        onClearSelection={() => {}}
        categories={[]}
      />
    );

    expect(screen.queryByText('Move')).not.toBeInTheDocument();
  });

  it('opens move modal when move button is clicked', () => {
    render(
      <BulkActionsToolbar
        selectedCount={2}
        onBulkEdit={() => {}}
        onBulkDelete={() => {}}
        onBulkMove={() => {}}
        onClearSelection={() => {}}
        categories={mockCategories}
      />
    );

    fireEvent.click(screen.getByText('Move'));
    expect(screen.getByText('Move 2 products to:')).toBeInTheDocument();
  });

  it('calls onBulkDelete with confirmation when delete button is clicked', () => {
    const mockOnBulkDelete = vi.fn();
    // Mock window.confirm to return true
    window.confirm = vi.fn(() => true);
    
    render(
      <BulkActionsToolbar
        selectedCount={2}
        onBulkEdit={() => {}}
        onBulkDelete={mockOnBulkDelete}
        onBulkMove={() => {}}
        onClearSelection={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Delete'));
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete 2 products? This action cannot be undone.');
    expect(mockOnBulkDelete).toHaveBeenCalled();
  });

  it('does not call onBulkDelete when confirmation is cancelled', () => {
    const mockOnBulkDelete = vi.fn();
    // Mock window.confirm to return false
    window.confirm = vi.fn(() => false);
    
    render(
      <BulkActionsToolbar
        selectedCount={2}
        onBulkEdit={() => {}}
        onBulkDelete={mockOnBulkDelete}
        onBulkMove={() => {}}
        onClearSelection={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnBulkDelete).not.toHaveBeenCalled();
  });

  it('calls onClearSelection when close button is clicked', () => {
    const mockOnClearSelection = vi.fn();
    
    render(
      <BulkActionsToolbar
        selectedCount={2}
        onBulkEdit={() => {}}
        onBulkDelete={() => {}}
        onBulkMove={() => {}}
        onClearSelection={mockOnClearSelection}
      />
    );

    fireEvent.click(screen.getByTitle('Clear selection'));
    expect(mockOnClearSelection).toHaveBeenCalled();
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <BulkActionsToolbar
        selectedCount={2}
        onBulkEdit={() => {}}
        onBulkDelete={() => {}}
        onBulkMove={() => {}}
        onClearSelection={() => {}}
        disabled={true}
      />
    );

    expect(screen.getByText('Edit')).toBeDisabled();
    expect(screen.getByText('Delete')).toBeDisabled();
  });
});
