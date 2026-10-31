<script setup lang="ts">
/** Gentle "how far along" dots. Not a score: every round is completed eventually. */
defineProps<{ current: number, total: number }>()
</script>

<template>
  <div class="flex items-center gap-2" role="img" :aria-label="`Round ${current} of ${total}`">
    <span
      v-for="n in total"
      :key="n"
      class="block rounded-full transition-all duration-300"
      :class="n < current ? 'size-4 bg-sunny' : n === current ? 'size-5 bg-coral' : 'size-4 bg-white'"
    />
  </div>
</template>
