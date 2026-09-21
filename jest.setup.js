jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(key => Promise.resolve(values.get(key) ?? null)),
      setItem: jest.fn((key, value) => {
        values.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn(key => {
        values.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        values.clear();
        return Promise.resolve();
      }),
    },
  };
});
jest.mock('react-native-webview', () => ({ WebView: 'WebView' }));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('@react-native-community/slider', () => 'Slider');
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) =>
      React.createElement(View, null, children),
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 0, left: 0 }),
  };
});
jest.mock('react-native-screens', () => require('react-native-screens/mock'));
