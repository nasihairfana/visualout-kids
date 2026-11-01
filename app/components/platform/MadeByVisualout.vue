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
    <p :class="dark ? 'text-cream/80' : 'text-ink-soft'">
      {{ brand.studioAbout }} We make Visualout Kids free, with no ads and nothing to buy, as a gift to
      families. If you like it, we'd love you to know who we are and what else we make.
    </p>

    <p v-if="brand.products.length" class="-mb-2 text-xs font-bold uppercase tracking-[0.18em]" :class="dark ? 'text-cream/60' : 'text-ink-soft'">
      Also from Visualout
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
      >Visit Visualout ↗</a>
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
