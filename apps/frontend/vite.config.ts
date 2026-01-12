import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';

const env = loadEnv('', process.cwd(), '');

const deploymentEnv = env.DEPLOYMENT_ENV || 'local';
const viteApiUrl = env.VITE_API_URL || 'http://localhost:3001';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@nexus-email/components/ui': path.resolve(__dirname, '../../packages/components/ui'),
      '@nexus-email/components/ui/*': path.resolve(__dirname, '../packages/components/ui'),
      '@nexus-email/lib': path.resolve(__dirname, '../../packages/lib/src'),
    },
  },
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
