const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname, {
  // This enables the new experimental PNPM support in Metro
  unstable_enableSymlinks: true, 
  unstable_enablePackageExports: true,
});

module.exports = withNativeWind(config, { input: "./global.css" });