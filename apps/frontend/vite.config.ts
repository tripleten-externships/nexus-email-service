import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');

const deploymentEnv = env.DEPLOYMENT_ENV || 'local';
const viteApiUrl = env.VITE_API_URL || 'http://localhost:3001';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  define: {
    global: 'globalThis',
    'process.env.DEPLOYMENT_ENV': `'${deploymentEnv}'`,
    VITE_API_URL: `'${viteApiUrl}'`,
    'process.env.NODE_ENV': `'${deploymentEnv === 'local' ? 'development' : 'production'}'`,
  },
});
