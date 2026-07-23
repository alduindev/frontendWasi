import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const requestedMode = process.env.VITE_APP_ENV?.toLowerCase()
const mode = ['dev', 'pre', 'prod'].includes(requestedMode) ? requestedMode : 'dev'
if (mode === 'dev' && !process.env.VITE_API_URL) {
  process.env.VITE_API_URL = 'https://backend-wasi-dev.onrender.com/api/v1'
}
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const result = spawnSync(process.execPath, [vite, 'build', '--mode', mode], { stdio: 'inherit' })
process.exit(result.status ?? 1)
