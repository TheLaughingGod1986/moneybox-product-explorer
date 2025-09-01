import React, { useState, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

const DraggableList = ({ 
  items, 
  onReorder, 
  renderItem, 
  keyExtractor,
  className = '',
  disabled = false,
  selectable = false,
  selectedItems = [],
  onSelectionChange
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Handle item selection
  const handleItemSelection = useCallback((item, isSelected) => {
    if (!selectable || !onSelectionChange) return;
    
    const itemKey = keyExtractor(item);
    let newSelection;
    
    if (isSelected) {
      newSelection = [...selectedItems, itemKey];
    } else {
      newSelection = selectedItems.filter(key => key !== itemKey);
    }
    
    onSelectionChange(newSelection);
  }, [selectable, selectedItems, onSelectionChange, keyExtractor]);

  // Handle select all
  const handleSelectAll = useCallback((selectAll) => {
    if (!selectable || !onSelectionChange) return;
    
    if (selectAll) {
      const allKeys = items.map(keyExtractor);
      onSelectionChange(allKeys);
    } else {
      onSelectionChange([]);
    }
  }, [selectable, items, onSelectionChange, keyExtractor]);

  // Handle drag start
  const handleDragStart = useCallback((e, index) => {
    if (disabled) return;
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    // Add drag preview styling
    e.target.style.opacity = '0.5';
  }, [disabled]);

  // Handle drag end
  const handleDragEnd = useCallback((e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e, index) => {
    if (disabled) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex, disabled]);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e, dropIndex) => {
    if (disabled) return;
    
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newItems = [...items];
      const draggedItem = newItems[draggedIndex];
      
      // Remove dragged item
      newItems.splice(draggedIndex, 1);
      
      // Insert at new position
      const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
      newItems.splice(adjustedDropIndex, 0, draggedItem);
      
      // Update order values
      const reorderedItems = newItems.map((item, index) => ({
        ...item,
        order: index + 1
      }));
      
      onReorder(reorderedItems);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, items, onReorder, disabled]);

  const allSelected = selectable && items.length > 0 && selectedItems.length === items.length;
  const someSelected = selectable && selectedItems.length > 0 && selectedItems.length < items.length;

  return (
    <div className={`draggable-list ${className}`}>
      <style>{`
        .draggable-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .draggable-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          transition: all 0.2s;
          cursor: move;
        }
        .draggable-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .draggable-item.dragging {
          opacity: 0.5;
          transform: rotate(2deg);
        }
        .draggable-item.drag-over {
          border-color: #667eea;
          background: #f0f4ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }
        .draggable-item.disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .draggable-item.selected {
          border-color: #667eea;
          background: #f0f4ff;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
        }
        .select-all-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          margin-bottom: 8px;
          font-size: 14px;
          color: #64748b;
        }
        .selection-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .selection-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .drag-handle {
          color: #94a3b8;
          cursor: grab;
          flex-shrink: 0;
        }
        .drag-handle:hover {
          color: #64748b;
        }
        .drag-handle:active {
          cursor: grabbing;
        }
        .item-content {
          flex: 1;
          min-width: 0;
        }
        .drop-indicator {
          height: 2px;
          background: #667eea;
          border-radius: 1px;
          margin: 4px 0;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .drop-indicator.active {
          opacity: 1;
        }
        @media (max-width: 768px) {
          .draggable-item {
            padding: 12px 8px;
          }
          .drag-handle {
            padding: 4px;
          }
        }
      `}</style>
      
      {/* Select All Header */}
      {selectable && items.length > 0 && (
        <div className="select-all-header">
          <div className="selection-controls">
            <input
              type="checkbox"
              className="selection-checkbox"
              checked={allSelected}
              ref={input => {
                if (input) input.indeterminate = someSelected;
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <span>
              {allSelected ? 'Deselect All' : someSelected ? `${selectedItems.length} Selected` : 'Select All'}
              {` (${items.length} items)`}
            </span>
          </div>
        </div>
      )}
      
      {items.map((item, index) => {
        const itemKey = keyExtractor(item);
        const isSelected = selectable && selectedItems.includes(itemKey);
        
        return (
        <div key={keyExtractor(item)}>
          {/* Drop indicator at the top */}
          {dragOverIndex === index && draggedIndex !== null && draggedIndex > index && (
            <div className="drop-indicator active" />
          )}
          
          <div
            className={`draggable-item ${
              draggedIndex === index ? 'dragging' : ''
            } ${
              dragOverIndex === index ? 'drag-over' : ''
            } ${
              disabled ? 'disabled' : ''
            } ${
              isSelected ? 'selected' : ''
            }`}
            draggable={!disabled && !selectable}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            {selectable && (
              <div className="selection-controls">
                <input
                  type="checkbox"
                  className="selection-checkbox"
                  checked={isSelected}
                  onChange={(e) => handleItemSelection(item, e.target.checked)}
                />
              </div>
            )}
            
            {!disabled && !selectable && (
              <div className="drag-handle">
                <GripVertical size={16} />
              </div>
            )}
            
            <div className="item-content">
              {renderItem(item, index)}
            </div>
          </div>
          
          {/* Drop indicator at the bottom */}
          {dragOverIndex === index && draggedIndex !== null && draggedIndex < index && (
            <div className="drop-indicator active" />
          )}
        </div>
        );
      })}
    </div>
  );
};

export default DraggableList;
