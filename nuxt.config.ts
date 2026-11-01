import tailwindcss from '@tailwindcss/vite'

// Visualout Kids (kids.visualout.com) is fully client-side: no server, no accounts, no tracking.
// `/` is the parent-facing home page; each game lives under its own path, starting with `/abc`.
// `nuxt generate` produces a static bundle that the service worker caches for offline play.

const SITE = 'https://kids.visualout.com'
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
      title: 'Visualout Kids · Free learning games for toddlers',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'description', content: 'Gentle learning games for toddlers by Visualout. Free, no ads, no tracking, and they work offline.' },
        { name: 'theme-color', content: '#FFF4E6' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'referrer', content: 'no-referrer' },
        // Link previews (WhatsApp, Facebook, X…). Game pages get their own copy from scripts/postbuild.mjs.
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Visualout Kids' },
        { property: 'og:title', content: 'Visualout Kids · Free learning games for toddlers' },
        { property: 'og:description', content: 'Gentle learning games for toddlers by Visualout. Free, no ads, no tracking, and they work offline.' },
        { property: 'og:url', content: `${SITE}/` },
        { property: 'og:image', content: `${SITE}/og/visualout-kids.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
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
      name: 'Visualout Kids',
      short_name: 'Visualout Kids',
      description: 'Gentle learning games for toddlers by Visualout. Free, private and offline.',
      lang: 'en',
      // The installed app opens straight into a game, never the parents' page with its outside links.
      start_url: '/abc/',
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
