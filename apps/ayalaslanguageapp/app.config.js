export default ({ config }) => {
  const stackEnv = process.env.STACK_ENV || 'Development';
  
  // Kick in /mobile logic for anything that isn't Development (Staging, Production, etc.)
  const isDeployed = stackEnv.toLowerCase() !== 'development';

  return {
    ...config,
    name: "LangApp XYZ",
    slug: "AyalasLanguageApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "ayalaslanguageapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ayalasw.AyalasLanguageApp",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.ayalasw.AyalasLanguageApp",
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ]
    },
    updates: {
      fallbackToCacheTimeout: 180000,
      url: "https://u.expo.dev/c0e996d0-d862-425e-a25c-b5961c60a5cf"
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/logo.png",
          "imageWidth": 190,
          "imageHeight": 55,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "image": "./assets/images/logo-dark.png",
            "backgroundColor": "#000000"
          }
        }
      ],
      "expo-secure-store",
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/Tajawal-Black.ttf",
            "./assets/fonts/Tajawal-Bold.ttf",
            "./assets/fonts/Tajawal-ExtraBold.ttf",
            "./assets/fonts/Tajawal-ExtraLight.ttf",
            "./assets/fonts/Tajawal-Light.ttf",
            "./assets/fonts/Tajawal-Medium.ttf",
            "./assets/fonts/Tajawal-Regular.ttf"
          ]
        }
      ],
      "expo-audio"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
      // In production (Docker), we serve from /mobile
      // In development, we serve from root (/)
      baseUrl: isDeployed ? '/mobile' : ''
    },
    extra: {
      router: {},
      eas: {
        projectId: "c0e996d0-d862-425e-a25c-b5961c60a5cf"
      }
    },
    runtimeVersion: {
      policy: "appVersion"
    }
  };
};