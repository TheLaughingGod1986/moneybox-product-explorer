import React, { useState, useRef, useCallback } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Type, Palette } from 'lucide-react';

const RichTextEditor = ({ value = '', onChange, placeholder = 'Enter content...' }) => {
  const editorRef = useRef(null);
  const [selectedText, setSelectedText] = useState('');

  // Execute formatting commands
  const executeCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    if (onChange) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current.focus();
  }, [onChange]);

  // Handle text selection
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    setSelectedText(selection.toString());
  }, []);

  // Handle content change
  const handleContentChange = useCallback(() => {
    if (onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Format buttons configuration
  const formatButtons = [
    { icon: Bold, command: 'bold', title: 'Bold (Ctrl+B)' },
    { icon: Italic, command: 'italic', title: 'Italic (Ctrl+I)' },
    { icon: Underline, command: 'underline', title: 'Underline (Ctrl+U)' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
  ];

  const colorButtons = [
    { color: '#000000', title: 'Black' },
    { color: '#667eea', title: 'Primary Blue' },
    { color: '#10b981', title: 'Success Green' },
    { color: '#f59e0b', title: 'Warning Orange' },
    { color: '#ef4444', title: 'Error Red' },
    { color: '#64748b', title: 'Secondary Gray' },
  ];

  // Insert link
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  // Set text size
  const setFontSize = (size) => {
    executeCommand('fontSize', size);
  };

  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .editor-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 8px 8px 0 0;
        }
        .toolbar-group {
          display: flex;
          gap: 2px;
          padding-right: 8px;
          border-right: 1px solid #e2e8f0;
        }
        .toolbar-group:last-child {
          border-right: none;
        }
        .toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          color: #64748b;
        }
        .toolbar-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
        .toolbar-btn:active {
          background: #cbd5e1;
        }
        .toolbar-select {
          padding: 4px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          background: white;
          font-size: 12px;
          cursor: pointer;
        }
        .color-btn {
          width: 24px;
          height: 24px;
          border: 2px solid #e2e8f0;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .color-btn:hover {
          transform: scale(1.1);
          border-color: #64748b;
        }
        .editor-content {
          min-height: 150px;
          padding: 16px;
          outline: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #1e293b;
        }
        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        .editor-content p {
          margin: 0 0 8px 0;
        }
        .editor-content p:last-child {
          margin-bottom: 0;
        }
        .editor-content ul, .editor-content ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        .editor-content li {
          margin: 4px 0;
        }
        .editor-content a {
          color: #667eea;
          text-decoration: underline;
        }
        .editor-content strong {
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .editor-toolbar {
            padding: 8px;
            gap: 2px;
          }
          .toolbar-btn {
            width: 28px;
            height: 28px;
          }
          .toolbar-group {
            padding-right: 6px;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="editor-toolbar">
        {/* Text Formatting */}
        <div className="toolbar-group">
          {formatButtons.map(({ icon: Icon, command, title }) => (
            <button
              key={command}
              className="toolbar-btn"
              onClick={() => executeCommand(command)}
              title={title}
              type="button"
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* Font Size */}
        <div className="toolbar-group">
          <select
            className="toolbar-select"
            onChange={(e) => setFontSize(e.target.value)}
            defaultValue="3"
            title="Font Size"
          >
            <option value="1">Small</option>
            <option value="3">Normal</option>
            <option value="4">Large</option>
            <option value="5">X-Large</option>
          </select>
        </div>

        {/* Colors */}
        <div className="toolbar-group">
          {colorButtons.map(({ color, title }) => (
            <button
              key={color}
              className="color-btn"
              style={{ backgroundColor: color }}
              onClick={() => executeCommand('foreColor', color)}
              title={title}
              type="button"
            />
          ))}
        </div>

        {/* Link */}
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={insertLink}
            title="Insert Link"
            type="button"
          >
            <Link size={16} />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
};

export default RichTextEditor;
