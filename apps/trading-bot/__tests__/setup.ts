// Jest setup file - runs before all tests
// Mock process.exit to prevent test suite from exiting
const originalExit = process.exit;
(process.exit as any) = jest.fn((code?: number) => {
  // Don't actually exit during tests - just log
  // This prevents app.ts from killing the test process
});

// Restore after all tests
if (typeof afterAll !== 'undefined') {
  afterAll(() => {
    process.exit = originalExit;
  });
}

