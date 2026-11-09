import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  // 시나리오 데이터(JSON)가 번들에 함께 들어가 크기가 큽니다.
  build: { chunkSizeWarningLimit: 1200 },
})
