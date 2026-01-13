import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';

const env = loadEnv('', process.cwd(), '');

const deploymentEnv = env.DEPLOYMENT_ENV || 'local';
const viteApiUrl = env.VITE_API_URL || 'http://localhost:3001';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      'src/lib/utils': path.resolve(__dirname, '../../packages/lib/src/utils.ts'),
      '@nexus-email/components': path.resolve(__dirname, '../../packages/ui/src/components'),
      '@nexus-email/components/ui': path.resolve(__dirname, '../../packages/ui/src/components/ui'),
      '@nexus-email/lib': path.resolve(__dirname, '../../packages/lib/src'),
    },
  },
  define: {
    global: 'globalThis',
    'process.env.DEPLOYMENT_ENV': `'${deploymentEnv}'`,
    VITE_API_URL: `'${viteApiUrl}'`,
    'process.env.NODE_ENV': `'${deploymentEnv === 'local' ? 'development' : 'production'}'`,
  },
});
