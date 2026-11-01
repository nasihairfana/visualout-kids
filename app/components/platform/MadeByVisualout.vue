<script setup lang="ts">
import { brand } from '~/data/brand'

/**
 * "Who makes this" credit for grown-ups. Only used on parent-facing screens (the home page and
 * Parent settings behind the hold gate), because it links out of the app.
 */
defineProps<{ dark?: boolean }>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-3" :class="dark ? 'text-cream/80' : 'text-ink-soft'">
      <p>
        We created Visualout Kids as a gift to families — free to use, with no ads, no tracking, and
        nothing to buy.
      </p>
      <p>
        We believe good software should be accessible to everyone. If you enjoy Visualout Kids, we'd love
        you to discover more about us and what we're building.
      </p>
    </div>

    <p v-if="brand.products.length" class="-mb-2 text-xs font-bold uppercase tracking-[0.18em]" :class="dark ? 'text-cream/60' : 'text-ink-soft'">
      More from Visualout
    </p>
    <ul v-if="brand.products.length" class="grid gap-3 sm:grid-cols-2">
      <li v-for="product in brand.products" :key="product.name">
        <a
          :href="product.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex min-h-16 flex-col justify-center rounded-2xl px-4 py-3"
          :class="dark ? 'bg-white/10 hover:bg-white/15' : 'bg-lilac/60 hover:bg-lilac'"
        >
          <span class="font-black" :class="dark ? 'text-sunny' : 'text-lilac-ink'">{{ product.name }} ↗</span>
          <span class="text-sm" :class="dark ? 'text-cream/75' : 'text-ink-soft'">{{ product.tagline }}</span>
        </a>
      </li>
    </ul>

    <div class="flex flex-wrap gap-3">
      <a
        :href="brand.studioUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="toy-press inline-flex min-h-14 items-center rounded-full px-6 font-black"
        :class="dark ? 'bg-sunny text-ink' : 'bg-ink text-cream'"
      >Explore Visualout ↗</a>
      <a
        :href="brand.sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex min-h-14 items-center rounded-full border-2 px-6 font-bold"
        :class="dark ? 'border-cream/25 text-cream hover:bg-white/10' : 'border-ink/15 text-ink hover:bg-white'"
      >Open-source code ↗</a>
    </div>
  </div>
</template>
