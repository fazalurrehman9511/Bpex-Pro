/** Android APK — place real file at public/app/flowexch.apk, then set VITE_ANDROID_APK_URL=/app/flowexch.apk */
export const ANDROID_APK_URL = (import.meta.env.VITE_ANDROID_APK_URL || '').trim()

/** Only true when a real APK URL is configured (avoids broken "parse package" installs) */
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
