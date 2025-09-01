import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RichTextEditor from '../components/RichTextEditor';

describe('RichTextEditor', () => {
  it('renders the editor with toolbar', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    
    // Check if toolbar buttons are present
    expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
    expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument();
    expect(screen.getByTitle('Underline (Ctrl+U)')).toBeInTheDocument();
    expect(screen.getByTitle('Bullet List')).toBeInTheDocument();
    expect(screen.getByTitle('Numbered List')).toBeInTheDocument();
  });

  it('displays placeholder text when empty', () => {
    const placeholder = 'Enter your content here...';
    render(<RichTextEditor value="" onChange={() => {}} placeholder={placeholder} />);
    
    const editor = document.querySelector('.editor-content');
    expect(editor).toHaveAttribute('data-placeholder', placeholder);
  });

  it('calls onChange when content is modified', async () => {
    const mockOnChange = vi.fn();
    render(<RichTextEditor value="" onChange={mockOnChange} />);
    
    const editor = document.querySelector('.editor-content');
    
    // Simulate typing in the editor
    fireEvent.input(editor, {
      target: { innerHTML: '<p>Test content</p>' }
    });
    
    expect(mockOnChange).toHaveBeenCalledWith('<p>Test content</p>');
  });

  it('renders initial value correctly', () => {
    const initialValue = '<p>Initial <strong>bold</strong> content</p>';
    render(<RichTextEditor value={initialValue} onChange={() => {}} />);
    
    const editor = document.querySelector('.editor-content');
    expect(editor.innerHTML).toBe(initialValue);
  });

  it('has color selection buttons', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    
    // Check for color buttons
    expect(screen.getByTitle('Primary Blue')).toBeInTheDocument();
    expect(screen.getByTitle('Success Green')).toBeInTheDocument();
    expect(screen.getByTitle('Error Red')).toBeInTheDocument();
  });

  it('has font size selector', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    
    const fontSizeSelect = screen.getByTitle('Font Size');
    expect(fontSizeSelect).toBeInTheDocument();
    expect(fontSizeSelect.tagName).toBe('SELECT');
  });

  it('executes formatting commands when toolbar buttons are clicked', () => {
    // Mock document.execCommand
    const mockExecCommand = vi.fn();
    document.execCommand = mockExecCommand;
    
    const mockOnChange = vi.fn();
    render(<RichTextEditor value="" onChange={mockOnChange} />);
    
    // Click bold button
    const boldButton = screen.getByTitle('Bold (Ctrl+B)');
    fireEvent.click(boldButton);
    
    expect(mockExecCommand).toHaveBeenCalledWith('bold', false, null);
  });

  it('handles link insertion', () => {
    // Mock prompt
    window.prompt = vi.fn().mockReturnValue('https://example.com');
    
    // Mock document.execCommand
    const mockExecCommand = vi.fn();
    document.execCommand = mockExecCommand;
    
    render(<RichTextEditor value="" onChange={() => {}} />);
    
    // Click link button
    const linkButton = screen.getByTitle('Insert Link');
    fireEvent.click(linkButton);
    
    expect(window.prompt).toHaveBeenCalledWith('Enter URL:');
    expect(mockExecCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com');
  });
});
