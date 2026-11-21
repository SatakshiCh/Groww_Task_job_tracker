import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:single` produces one self-contained index.html (used for the hosted demo).
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  define: {
    __HASH_ROUTER__: JSON.stringify(mode === 'single'),
  },
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
  },
}))
