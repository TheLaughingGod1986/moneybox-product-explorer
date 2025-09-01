import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DraggableList from '../components/DraggableList';

const mockItems = [
  { id: '1', name: 'Item 1', order: 1 },
  { id: '2', name: 'Item 2', order: 2 },
  { id: '3', name: 'Item 3', order: 3 },
];

const mockRenderItem = (item) => (
  <div data-testid={`item-${item.id}`}>
    {item.name} (Order: {item.order})
  </div>
);

describe('DraggableList', () => {
  it('renders all items correctly', () => {
    render(
      <DraggableList
        items={mockItems}
        onReorder={() => {}}
        renderItem={mockRenderItem}
        keyExtractor={(item) => item.id}
      />
    );

    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
    expect(screen.getByTestId('item-3')).toBeInTheDocument();
  });

  it('shows drag handles for each item', () => {
    render(
      <DraggableList
        items={mockItems}
        onReorder={() => {}}
        renderItem={mockRenderItem}
        keyExtractor={(item) => item.id}
      />
    );

    const dragHandles = document.querySelectorAll('.drag-handle');
    expect(dragHandles).toHaveLength(3);
  });

  it('hides drag handles when disabled', () => {
    render(
      <DraggableList
        items={mockItems}
        onReorder={() => {}}
        renderItem={mockRenderItem}
        keyExtractor={(item) => item.id}
        disabled={true}
      />
    );

    const dragHandles = document.querySelectorAll('.drag-handle');
    expect(dragHandles).toHaveLength(0);
  });

  it('applies disabled class when disabled', () => {
    render(
      <DraggableList
        items={mockItems}
        onReorder={() => {}}
        renderItem={mockRenderItem}
        keyExtractor={(item) => item.id}
        disabled={true}
      />
    );

    const draggableItems = document.querySelectorAll('.draggable-item');
    draggableItems.forEach(item => {
      expect(item).toHaveClass('disabled');
    });
  });

  it('calls onReorder when items are reordered', () => {
    const mockOnReorder = vi.fn();
    
    render(
      <DraggableList
        items={mockItems}
        onReorder={mockOnReorder}
        renderItem={mockRenderItem}
        keyExtractor={(item) => item.id}
      />
    );

    const draggableItems = document.querySelectorAll('.draggable-item');
    const firstItem = draggableItems[0];
    const thirdItem = draggableItems[2];

    // Simulate drag start on first item
    fireEvent.dragStart(firstItem);

    // Simulate drop on third item
    fireEvent.drop(thirdItem);

    expect(mockOnReorder).toHaveBeenCalled();
  });

  it('applies correct CSS classes during drag operations', () => {
    render(
      <DraggableList
        items={mockItems}
        onReorder={() => {}}
        renderItem={mockRenderItem}
        keyExtractor={(item) => item.id}
      />
    );

    const draggableItems = document.querySelectorAll('.draggable-item');
    const firstItem = draggableItems[0];

    // Simulate drag start
    fireEvent.dragStart(firstItem);
    expect(firstItem).toHaveClass('dragging');

    // Simulate drag end
    fireEvent.dragEnd(firstItem);
    expect(firstItem).not.toHaveClass('dragging');
  });

  it('shows drop indicators during drag over', () => {
    render(
      <DraggableList
        items={mockItems}
        onReorder={() => {}}
        renderItem={mockRenderItem}
        keyExtractor={(item) => item.id}
      />
    );

    const draggableItems = document.querySelectorAll('.draggable-item');
    const firstItem = draggableItems[0];
    const secondItem = draggableItems[1];

    // Simulate drag start on first item
    fireEvent.dragStart(firstItem);

    // Simulate drag over second item
    fireEvent.dragOver(secondItem);
    expect(secondItem).toHaveClass('drag-over');

    // Simulate drag leave
    fireEvent.dragLeave(secondItem);
    expect(secondItem).not.toHaveClass('drag-over');
  });

  it('handles custom className prop', () => {
    render(
      <DraggableList
        items={mockItems}
        onReorder={() => {}}
        renderItem={mockRenderItem}
        keyExtractor={(item) => item.id}
        className="custom-class"
      />
    );

    const container = document.querySelector('.draggable-list');
    expect(container).toHaveClass('custom-class');
  });
});
