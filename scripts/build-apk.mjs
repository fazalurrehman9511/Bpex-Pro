#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const jdkHome = join(root, '.tools/jdk-17.0.19+10/Contents/Home')
const sdkHome = join(root, '.tools/android-sdk')
const androidDir = join(root, 'android')
const apkSrc = join(androidDir, 'app/build/outputs/apk/debug/app-debug.apk')
const apkDest = join(root, 'public/app/flowexch.apk')

if (!existsSync(jdkHome)) {
  console.error('JDK 17 missing at', jdkHome)
  process.exit(1)
}
if (!existsSync(sdkHome)) {
  console.error('Android SDK missing at', sdkHome)
  process.exit(1)
}

/** Capacitor sync regenerates these with Java 21; portable JDK here is 17. */
for (const rel of [
  'android/app/capacitor.build.gradle',
  'android/capacitor-cordova-android-plugins/build.gradle',
]) {
  const p = join(root, rel)
  if (!existsSync(p)) continue
  const next = readFileSync(p, 'utf8').replaceAll('VERSION_21', 'VERSION_17')
  writeFileSync(p, next)
}

const env = {
  ...process.env,
  JAVA_HOME: jdkHome,
  ANDROID_HOME: sdkHome,
  PATH: `${join(jdkHome, 'bin')}:${join(sdkHome, 'cmdline-tools/latest/bin')}:${join(sdkHome, 'platform-tools')}:${process.env.PATH || ''}`,
}

const result = spawnSync('./gradlew', ['assembleDebug', '--no-daemon'], {
  cwd: androidDir,
  env,
  stdio: 'inherit',
  shell: false,
})

if (result.status !== 0) {
  process.exit(result.status || 1)
}

if (!existsSync(apkSrc)) {
  console.error('APK not found at', apkSrc)
  process.exit(1)
}

mkdirSync(dirname(apkDest), { recursive: true })
copyFileSync(apkSrc, apkDest)
console.log('APK ready:', apkDest)
