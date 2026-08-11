/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@nestjs/passport$': '<rootDir>/src/__tests__/__mocks__/nestjs-passport.ts',
    '^passport$': '<rootDir>/src/__tests__/__mocks__/passport.ts',
  },
  collectCoverageFrom: [
    'src/common/**/*.ts',
    '!src/common/**/*.module.ts',
    '!src/index.ts',
  ],
};
