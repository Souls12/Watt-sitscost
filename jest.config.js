module.exports = {
  preset: 'jest-expo',
  // testRegex y no testMatch: con la ruta bajo .claude/ el glob no encontraba nada.
  testRegex: 'src/.*\\.test\\.ts$',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
