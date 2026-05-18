import expoConfig from 'eslint-config-expo/flat.js';

const FORBIDDEN_NETWORK_PACKAGES = [
  '@sentry/react-native',
  '@bugsnag/react-native',
  '@amplitude/react-native',
  '@segment/analytics-react-native',
  'mixpanel-react-native',
  'posthog-react-native',
  '@react-native-firebase/analytics',
  '@react-native-firebase/crashlytics',
  '@react-native-firebase/remote-config',
  '@react-native-firebase/perf',
  'react-native-google-analytics-bridge',
  'react-native-google-mobile-ads',
  'react-native-facebook-ads',
  'react-native-onesignal',
  'react-native-appsflyer',
  'react-native-adjust',
];

export default [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', 'ios/*', 'android/*'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...FORBIDDEN_NETWORK_PACKAGES.map((name) => ({
              name,
              message:
                'This package may transmit data off-device. App must remain network-free per SPEC.md §6.',
            })),
            {
              name: 'expo-media-library',
              message:
                'Do not import expo-media-library directly. Use the wrapper at src/features/library/safe-media.ts to enforce hidden/deleted photo filtering (SPEC.md §6).',
            },
          ],
          patterns: [
            {
              group: ['firebase', '@firebase/*', 'firebase/*'],
              message: 'Firebase clients may phone home. Not allowed (SPEC.md §6).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/library/safe-media.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
