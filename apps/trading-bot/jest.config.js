/** @type {import("ts-jest").JestConfigWithTsJest} **/
module.exports = {
  displayName: "trading-bot",
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(ts|js)$": "ts-jest",
  },
  collectCoverageFrom: ["<rootDir>/src/**/*.ts"],
  coverageDirectory: "<rootDir>/coverage",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/main.ts",
    "<rootDir>/src/app.ts",
  ],
};

