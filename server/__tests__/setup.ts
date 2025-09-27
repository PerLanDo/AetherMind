// Test setup file for authentication tests
import { beforeAll, afterAll, jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key';

// Increase test timeout for database operations
jest.setTimeout(30000);

beforeAll(async () => {
  // Additional setup if needed
});

afterAll(async () => {
  // Cleanup after tests
});