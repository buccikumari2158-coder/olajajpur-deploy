// Web stub for react-native-onesignal (native-only SDK).
export const OneSignal = {
  initialize: () => {},
  login: () => {},
  logout: () => {},
  Notifications: {
    requestPermission: () => Promise.resolve(false),
    addEventListener: () => {},
  },
};
export const LogLevel = { None: 0, Verbose: 6 };
export default { OneSignal, LogLevel };
