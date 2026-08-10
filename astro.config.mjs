import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://go.assembly-detroit.com',
  integrations: [tailwind({
    applyBaseStyles: false
  })],
});
