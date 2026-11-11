<script setup lang="ts">
import { numberGameById } from '~/data/number-games'
import { DIFFICULTIES, type Difficulty } from '~/games/numbers/rounds'

const route = useRoute()
const progress = useNumbersProgress()
// An unknown or still-locked adventure goes back to the list rather than showing an error.
const game = computed(() => {
  const g = numberGameById(String(route.params.game))
  return g && progress.isUnlocked(g.id) ? g : undefined
})
const difficulty = computed<Difficulty>(() => {
  const asked = String(route.query.difficulty ?? '')
  return (DIFFICULTIES as string[]).includes(asked) ? asked as Difficulty : progress.difficulty.value
})
if (!game.value) navigateTo('/numbers', { replace: true })
useHead({ title: () => `${game.value?.title ?? 'Numbers'} · Numbers & Counting` })
</script>

<template>
  <NumbersPlay v-if="game" :key="`${game.id}-${difficulty}`" :game="game" :difficulty="difficulty" />
</template>
