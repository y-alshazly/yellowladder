const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  passWithNoTests: true,
  clearMocks: true,
  testTimeout: 10_000,
  transform: {
    '^.+\\.(ts|js|mts|mjs|cts|cjs|html)$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/index.ts',
    '!src/**/*.module.ts',
    '!src/**/*.controller.ts',
    '!src/**/*.repository.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.integration-spec.ts',
    '!src/**/*.types.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.constants.ts',
    '!src/**/*.config.ts',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  coverageReporters: ['text', 'lcov', 'json-summary'],
};
