import '@testing-library/jest-dom';

// Mock the API service module
vi.mock('../services/api.js', () => import('./__tests__/mocks/apiService.js'));
