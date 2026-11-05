import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import process from 'node:process';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
    ...(process.env.LEARNAPROP_E2E === '1'
      ? { persistState: { path: '.wrangler/e2e-state' } }
      : {}),
  }),
  session: false,
  vite: { plugins: [tailwindcss()] },
});
