module.exports = {
  preset: '@react-native/jest-preset',
  // Worklets는 Jest에서 iOS 네이티브 런타임 대신 제공된 JS 구현으로 해석한다.
  resolver: 'react-native-worklets/jest/resolver',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|@react-navigation|react-native-image-crop-picker)/',
  ],
};
