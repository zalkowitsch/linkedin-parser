export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  testMatch: [
    '**/src/**/__tests__/**/*.(ts|js)',
    '**/src/**/*.(test|spec).(ts|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/lib/',
    '/dist/'
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|js)',
    '!src/**/*.d.ts',
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }]
  }
};