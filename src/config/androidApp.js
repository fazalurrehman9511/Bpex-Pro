/** Android APK — defaults to the standard public path so live deploys still show the button even if env is missing. */
export const ANDROID_APK_URL = (
  import.meta.env.VITE_ANDROID_APK_URL || '/app/flowexch.apk'
).trim()

/** Only true when we have a non-empty APK URL. */
export const ANDROID_APK_AVAILABLE = Boolean(ANDROID_APK_URL)

export const ANDROID_APP = {
  name: 'BpxPro App',
  versionLabel: import.meta.env.VITE_ANDROID_APP_VERSION || 'Latest',
  minAndroid: 'Android 6.0+',
  features: [
    'Login with your BPEXCH ID',
    'Deposit & withdraw (JazzCash / EasyPaisa / Bank)',
    'Live support & transaction history',
    'Quick access from home screen',
  ],
}
