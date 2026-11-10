<script setup lang="ts">
import type { Difficulty } from '~/games/trail/levels'
import { DIFFICULTIES } from '~/games/trail/levels'

useHead({ title: 'Letter Trails · My First ABC' })

// Unknown or still-locked choices fall back to the first world at Beginner.
const route = useRoute()
const progress = useTrailProgress()
const difficulty = computed<Difficulty>(() => {
  const d = route.query.difficulty as Difficulty
  return DIFFICULTIES.includes(d) ? d : 'beginner'
})
const world = computed(() => {
  const w = String(route.query.world ?? '')
  return progress.isUnlocked(w) ? w : 'garden'
})
</script>

<template>
  <TrailGame :key="`${difficulty}-${world}`" :difficulty="difficulty" :theme-id="world" />
</template>
