import tailwindcss from '@tailwindcss/vite'

// My First ABC is a fully client-side toy: no server, no accounts, no tracking.
// `nuxt generate` produces a static bundle that the service worker caches for offline play.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  ssr: false,
  devtools: { enabled: false },
  telemetry: false,

  modules: ['@vite-pwa/nuxt'],

  // Flat component names (AudioButton, not GameAudioButton) regardless of folder.
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'My First ABC · Visualout Kids',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'description', content: 'A gentle A–Z alphabet toy for toddlers. Offline, ad-free and private.' },
        { name: 'theme-color', content: '#FFF4E6' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'referrer', content: 'no-referrer' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/icon.svg' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-180x180.png' },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    manifest: {
      name: 'My First ABC · Visualout Kids',
      short_name: 'My First ABC',
      description: 'A gentle A–Z alphabet toy for toddlers.',
      lang: 'en',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      background_color: '#FFF4E6',
      theme_color: '#FFF4E6',
      categories: ['education', 'kids'],
      icons: [
        { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      // Everything the game needs, including any recorded audio dropped into /public/audio.
      globPatterns: ['**/*.{js,css,html,svg,png,webp,jpg,ico,json,mp3,m4a,ogg,wav,woff2}'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      cleanupOutdatedCaches: true,
    },
    client: {
      installPrompt: false,
    },
    devOptions: {
      enabled: false,
    },
  },
})
