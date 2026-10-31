<script setup lang="ts">
// Inline icon set — no icon font or network request needed offline.
type IconName = 'speaker' | 'speaker-off' | 'home' | 'prev' | 'next' | 'grid' | 'lock' | 'replay' | 'close' | 'star'

defineProps<{ name: IconName }>()
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'speaker'">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
    </template>
    <template v-else-if="name === 'speaker-off'">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </template>
    <template v-else-if="name === 'home'">
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M6 9.5V20h12V9.5" fill="currentColor" fill-opacity="0.15" />
      <path d="M10 20v-5h4v5" />
    </template>
    <path v-else-if="name === 'prev'" d="M15 4.5 7.5 12 15 19.5" stroke-width="3.2" />
    <path v-else-if="name === 'next'" d="M9 4.5 16.5 12 9 19.5" stroke-width="3.2" />
    <template v-else-if="name === 'grid'">
      <rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" />
    </template>
    <template v-else-if="name === 'lock'">
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" fill-opacity="0.15" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </template>
    <template v-else-if="name === 'replay'">
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4 4.5v4h4" />
    </template>
    <path v-else-if="name === 'close'" d="M6 6l12 12M18 6 6 18" stroke-width="3" />
    <path v-else-if="name === 'star'" d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="currentColor" />
  </svg>
</template>
