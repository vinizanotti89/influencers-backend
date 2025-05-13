export default {
    transform: {},
    testEnvironment: 'node',
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    testMatch: [
      '**/src/__tests__/**/*.test.js'
    ],
    verbose: true,
    testTimeout: 10000
  };