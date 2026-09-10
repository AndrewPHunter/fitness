import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export const APP_BASE_PATH = '/fitness/';

export default defineConfig({
  base: APP_BASE_PATH,
  plugins: [react()],
  build: { sourcemap: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
