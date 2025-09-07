import { beforeAll } from 'vitest';

// Global test setup for unit tests
beforeAll(async () => {
  // Simple setup for unit tests - no Docker required
  console.log('Setting up unit tests...');
  
  // Note: For integration tests that need database, 
  // run docker-compose.test.yml manually first
});