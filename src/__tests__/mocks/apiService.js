// Mock API service for testing
export const apiService = {
  getCategories: () => Promise.resolve({
    data: {
      categories: [
        {
          id: 'savings',
          name: 'Savings',
          order: 1,
          products: [
            {
              id: 'cash-isa',
              name: 'Cash ISA',
              description: 'A tax-free way to save up to £20,000 per year with instant access to your money',
              icon: '💰',
              order: 1
            },
            {
              id: 'easy-access',
              name: 'Easy Access Account', 
              description: 'Instant access to your money with competitive interest rates and no monthly fees',
              icon: '🏦',
              order: 2
            }
          ]
        },
        {
          id: 'investing',
          name: 'Investing',
          order: 2,
          products: [
            {
              id: 'stocks-shares-isa',
              name: 'Stocks & Shares ISA',
              description: 'Invest up to £20,000 tax-free in a diversified portfolio of funds',
              icon: '📈',
              order: 1
            },
            {
              id: 'general-investment',
              name: 'General Investment Account',
              description: 'Flexible investing with no annual limits and access to a wide range of funds',
              icon: '💹',
              order: 2
            }
          ]
        },
        {
          id: 'pensions',
          name: 'Pensions',
          order: 3,
          products: [
            {
              id: 'personal-pension',
              name: 'Personal Pension',
              description: 'Build your retirement fund with tax relief and employer contributions',
              icon: '🏡',
              order: 1
            }
          ]
        }
      ],
      metadata: {
        lastUpdated: '2025-08-31T10:00:00Z',
        version: '1.0.0'
      }
    }
  }),
  createCategory: (data) => Promise.resolve({ data: { id: 'new-cat', ...data, order: 4, products: [] } }),
  updateCategory: (id, data) => Promise.resolve({ data: { id, ...data } }),
  deleteCategory: (id) => Promise.resolve(),
  createProduct: (data) => Promise.resolve({ data: { id: 'new-prod', ...data, order: 1 } }),
  updateProduct: (id, data) => Promise.resolve({ data: { id, ...data } }),
  deleteProduct: (id) => Promise.resolve(),
  healthCheck: () => Promise.resolve({ data: { status: 'OK', timestamp: new Date().toISOString() } })
};
