/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\.ts?$": ["ts-jest",{}],
  },
  setupFilesAfterEnv: ["<rootDir>/apps/trading-bot/__tests__/setup.ts"],
  testMatch: ["**/__tests__/**/*.spec.ts"],
};