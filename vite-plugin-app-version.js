import { execSync } from 'node:child_process'

function resolveBuildId() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return String(process.env.VERCEL_GIT_COMMIT_SHA).slice(0, 12)
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return Date.now().toString(36)
  }
}

/** Inject build id into HTML/JS and emit public/version.json on each production build. */
export function appVersionPlugin() {
  const buildId = resolveBuildId()
  const builtAt = new Date().toISOString()

  return {
    name: 'app-version',
    config() {
      return {
        define: {
          __APP_BUILD_ID__: JSON.stringify(buildId),
        },
      }
    },
    transformIndexHtml(html) {
      const tag = `<meta name="app-build-id" content="${buildId}" />`
      if (html.includes('name="app-build-id"')) return html
      return html.replace('<head>', `<head>\n    ${tag}`)
    },
    generateBundle(_options, bundle) {
      const payload = JSON.stringify({ version: buildId, builtAt }, null, 2)
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: payload,
      })

      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && file.fileName === 'index.html' && typeof file.source === 'string') {
          if (!file.source.includes('name="app-build-id"')) {
            file.source = file.source.replace('<head>', `<head>\n    <meta name="app-build-id" content="${buildId}" />`)
          }
        }
      }
    },
  }
}
