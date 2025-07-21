module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: ['GOOGLE_DRIVE_API_KEY', 'GOOGLE_DRIVE_CLIENT_ID'],
        safe: false,
        allowUndefined: true,
      },
    ],
  ],
};
