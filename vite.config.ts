import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// npm run build        → dist/        웹 서버·Azure Static Web Apps 배포용
// npm run build:local  → dist-local/  압축을 풀고 index.html 을 더블클릭해 여는 로컬 확인용
export default defineConfig(({ mode }) => {
  const local = mode === 'offline'
  return {
    // 상대 경로로 빌드해 어느 폴더·하위 경로에 올려도 동작하게 한다
    base: './',
    plugins: [react(), ...(local ? [viteSingleFile()] : [])],
    // 로컬용은 글꼴을 HTML 안에 넣어야 하므로 하나짜리 가변 글꼴 파일을 쓴다
    resolve: local
      ? { alias: { 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css': 'pretendard/dist/web/variable/pretendardvariable.css' } }
      : undefined,
    server: { port: 5173, host: true },
    build: local
      ? { outDir: 'dist-local', chunkSizeWarningLimit: 10000 }
      : { chunkSizeWarningLimit: 1200 },
  }
})
