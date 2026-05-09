module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/e_imar_web/src/$1'
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json'
    }
  }
};
