import '@testing-library/jest-dom/vitest';
import { beforeAll } from 'vitest';
import { initializeDefaultCatalog } from '../src';

// Initialize the default catalog before all tests
beforeAll(() => {
  initializeDefaultCatalog();
});
