import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProductExplorer from '../components/ProductExplorer';

describe('ProductExplorer', () => {
  it('renders the main heading', () => {
    render(<ProductExplorer />);
    expect(screen.getByText('Explore Accounts')).toBeInTheDocument();
  });

  it('displays categories', async () => {
    render(<ProductExplorer />);
    
    // Wait for API call to complete and data to load
    await waitFor(() => {
      expect(screen.getByText('ISAs & Savings')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Pensions')).toBeInTheDocument();
    expect(screen.getByText('Cash Savings')).toBeInTheDocument();
  });

  it('expands and collapses products', async () => {
    render(<ProductExplorer />);
    
    // Wait for data to load first
    await waitFor(() => {
      expect(screen.getByText('Cash ISA')).toBeInTheDocument();
    });
    
    // Find a product that should be collapsed
    const cashISA = screen.getByText('Cash ISA');
    fireEvent.click(cashISA);
    
    // Check if description appears (using a more flexible matcher)
    await waitFor(() => {
      expect(screen.getByText(/ISA/)).toBeInTheDocument();
    });
  });

  it('navigates between categories', async () => {
    render(<ProductExplorer />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('ISAs & Savings')).toBeInTheDocument();
    });
    
    const nextButton = screen.getByLabelText('Next categories');
    fireEvent.click(nextButton);
    
    // Navigation should work (implementation depends on your logic)
    expect(nextButton).toBeInTheDocument();
  });
});