module.exports = {
  preset: '@react-native/jest-preset',
  testTimeout: 20000,
  watchman: false,
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-navigation)/)',
  ],
};
