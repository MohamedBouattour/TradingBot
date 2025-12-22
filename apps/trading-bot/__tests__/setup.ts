// Jest setup file - runs before all tests
// Mock process.exit to prevent test suite from exiting
const originalExit = process.exit;
(process.exit as any) = jest.fn((code?: number) => {
  // Don't actually exit during tests - just log
  // This prevents app.ts from killing the test process
});

// Suppress verbose console output during tests to reduce memory usage
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Only suppress non-error logs to reduce memory usage from excessive output
// Use no-op functions instead of jest.fn() to reduce memory overhead
console.log = () => {};
console.warn = () => {};

// Restore after all tests
if (typeof afterAll !== 'undefined') {
  afterAll(() => {
    process.exit = originalExit;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });
}

