import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

export const APP_BASE_PATH = '/fitness/';

function serviceWorkerPlugin(): Plugin {
  return {
    name: 'fieldwork-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const shellFiles = Object.values(bundle)
        .map((entry) => entry.fileName)
        .filter((fileName) => /(?:\.html|\.js|\.css|\.woff2)$/u.test(fileName))
        .sort();
      const shellUrls = [
        APP_BASE_PATH,
        `${APP_BASE_PATH}index.html`,
        ...shellFiles.map((fileName) => `${APP_BASE_PATH}${fileName}`),
        `${APP_BASE_PATH}manifest.webmanifest`,
        `${APP_BASE_PATH}icons/icon-192.png`,
        `${APP_BASE_PATH}icons/icon-512.png`,
      ];
      const buildId = createHash('sha256')
        .update(
          shellFiles
            .map((fileName) => {
              const entry = bundle[fileName];
              if (!entry) return fileName;
              return `${fileName}:${entry.type === 'chunk' ? entry.code : String(entry.source)}`;
            })
            .join('\n'),
        )
        .update(readFileSync(new URL('./index.html', import.meta.url)))
        .update(readFileSync(new URL('./public/manifest.webmanifest', import.meta.url)))
        .update(readFileSync(new URL('./public/icons/icon-192.png', import.meta.url)))
        .update(readFileSync(new URL('./public/icons/icon-512.png', import.meta.url)))
        .digest('hex')
        .slice(0, 16);
      const source = `const CACHE_PREFIX = 'fieldwork-shell-';
const CACHE_NAME = CACHE_PREFIX + ${JSON.stringify(buildId)};
const SHELL_URLS = ${JSON.stringify(shellUrls, null, 2)};
const SHELL_PATHS = new Set(SHELL_URLS.map((url) => new URL(url, self.location.origin).pathname));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    clients.forEach((client) => client.postMessage({ type: 'FIELDWORK_UPDATE_ACTIVATED' }));
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIELDWORK_ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !SHELL_PATHS.has(url.pathname)) return;
  event.respondWith(caches.match(url.href, { ignoreSearch: true, ignoreVary: true }).then((cached) => cached ?? fetch(event.request)));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: APP_BASE_PATH,
  plugins: [react(), serviceWorkerPlugin()],
  build: { sourcemap: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
