import { defineConfig } from '@vite-pwa/assets-generator/config'

// Regenerate icons with: npx pwa-assets-generator
export default defineConfig({
  images: ['public/icons/icon.svg'],
  preset: {
    transparent: { sizes: [192, 512], favicons: [[48, 'favicon.ico']] },
    maskable: { sizes: [512], padding: 0.1, resizeOptions: { background: '#FFD8C2' } },
    apple: { sizes: [180], padding: 0.1, resizeOptions: { background: '#FFD8C2' } },
  },
})
