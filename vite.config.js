import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { networkInterfaces } from 'node:os'
import process from 'node:process'

function localNetworkAddress() {
  const addresses = Object.values(networkInterfaces()).flat().filter(Boolean)
  const privateAddress = addresses.find(({ address, family, internal }) => {
    if (internal || !address || !(family === 4 || family === 'IPv4')) return false
    const octets = address.split('.').map(Number)
    return octets[0] === 10
      || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
      || (octets[0] === 192 && octets[1] === 168)
  })
  return privateAddress?.address || ''
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '.', ''), ...process.env }
  if (mode !== 'localhost' && !env.VITE_API_URL) throw new Error(`VITE_API_URL es obligatorio para el modo ${mode}`)
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'
  const serverPort = Number(env.VITE_PORT || 5173)
  const qrAppUrl = env.VITE_QR_APP_URL || (
    mode === 'localhost' && localNetworkAddress()
      ? `http://${localNetworkAddress()}:${serverPort}`
      : ''
  )
  return {
  define: {
    'import.meta.env.VITE_QR_APP_URL': JSON.stringify(qrAppUrl),
  },
  server: {
    host: env.VITE_HOST || (mode === 'localhost' ? '0.0.0.0' : undefined),
    port: serverPort,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  }
})
