import React, { useState } from 'react';
import { Edit, Trash2, Move, Copy, X } from 'lucide-react';

const BulkActionsToolbar = ({ 
  selectedCount, 
  onBulkEdit, 
  onBulkDelete, 
  onBulkMove, 
  onClearSelection,
  categories = [],
  disabled = false 
}) => {
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState('');

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCount} products? This action cannot be undone.`)) {
      onBulkDelete();
    }
  };

  const handleBulkMove = () => {
    if (targetCategoryId && onBulkMove) {
      onBulkMove(targetCategoryId);
      setShowMoveModal(false);
      setTargetCategoryId('');
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="bulk-actions-toolbar">
        <style>{`
          .bulk-actions-toolbar {
            position: sticky;
            top: 0;
            z-index: 100;
            background: #667eea;
            color: white;
            padding: 12px 16px;
            margin: -16px -16px 16px -16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-radius: 8px 8px 0 0;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
            animation: slideDown 0.3s ease-out;
          }
          @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .bulk-info {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 500;
          }
          .bulk-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .bulk-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 6px;
            color: white;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .bulk-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
          }
          .bulk-btn:active {
            transform: translateY(0);
          }
          .bulk-btn.danger:hover {
            background: #ef4444;
          }
          .bulk-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .close-btn {
            padding: 6px;
            background: transparent;
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 4px;
            transition: background 0.2s;
          }
          .close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          .move-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .move-modal-content {
            background: white;
            padding: 24px;
            border-radius: 12px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          .move-modal h3 {
            margin: 0 0 16px 0;
            color: #1e293b;
          }
          .move-select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 14px;
          }
          .move-modal-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
          }
          .modal-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .modal-btn.primary {
            background: #667eea;
            color: white;
          }
          .modal-btn.primary:hover {
            background: #5a67d8;
          }
          .modal-btn.secondary {
            background: #f1f5f9;
            color: #64748b;
          }
          .modal-btn.secondary:hover {
            background: #e2e8f0;
          }
          @media (max-width: 768px) {
            .bulk-actions-toolbar {
              flex-direction: column;
              gap: 8px;
              padding: 12px;
            }
            .bulk-actions {
              width: 100%;
              justify-content: center;
            }
            .bulk-btn {
              flex: 1;
              justify-content: center;
            }
          }
        `}</style>

        <div className="bulk-info">
          <span>{selectedCount} product{selectedCount !== 1 ? 's' : ''} selected</span>
        </div>

        <div className="bulk-actions">
          <button 
            className="bulk-btn" 
            onClick={onBulkEdit}
            disabled={disabled}
            title="Edit selected products"
          >
            <Edit size={16} />
            Edit
          </button>

          {categories.length > 0 && (
            <button 
              className="bulk-btn" 
              onClick={() => setShowMoveModal(true)}
              disabled={disabled}
              title="Move to different category"
            >
              <Move size={16} />
              Move
            </button>
          )}

          <button 
            className="bulk-btn danger" 
            onClick={handleBulkDelete}
            disabled={disabled}
            title="Delete selected products"
          >
            <Trash2 size={16} />
            Delete
          </button>

          <button 
            className="close-btn" 
            onClick={onClearSelection}
            title="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Move Modal */}
      {showMoveModal && (
        <div className="move-modal" onClick={() => setShowMoveModal(false)}>
          <div className="move-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Move {selectedCount} products to:</h3>
            <select 
              className="move-select"
              value={targetCategoryId}
              onChange={(e) => setTargetCategoryId(e.target.value)}
            >
              <option value="">Select a category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="move-modal-actions">
              <button 
                className="modal-btn secondary"
                onClick={() => setShowMoveModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn primary"
                onClick={handleBulkMove}
                disabled={!targetCategoryId}
              >
                Move Products
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActionsToolbar;
