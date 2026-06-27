const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// ── Block Firebase's ephemeral build temp dirs from being watched ─────────
// Firebase SDK creates _tmp_NNN dirs during its build that get deleted
// immediately, causing Metro's file watcher to throw ENOENT errors.
config.resolver.blockList = [
  /node_modules\/.*\/_tmp_\d+\/.*/,
];

// ── Web stubs for native-only modules ────────────────────────────────────
const WEB_STUBS = {
  "react-native-maps": path.resolve(__dirname, "shims/react-native-maps.web.tsx"),
  // expo-firebase-recaptcha relies on a native WebView modal; stub it on web
  "expo-firebase-recaptcha": path.resolve(__dirname, "shims/expo-firebase-recaptcha.web.tsx"),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && WEB_STUBS[moduleName]) {
    return { filePath: WEB_STUBS[moduleName], type: "sourceFile" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
