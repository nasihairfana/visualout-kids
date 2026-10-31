<script setup lang="ts">
import type { SpokenClip } from '~/types/learning'

/**
 * End-of-activity celebration. Calm on purpose: one cheer, soft confetti, then the
 * child (or parent) chooses to play again or go home. No streaks, no prizes to chase.
 */
const props = defineProps<{
  message: string
  clip: SpokenClip
}>()

const emit = defineEmits<{ replay: [], home: [] }>()
const { say, effect } = useAudio()

const confetti = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 53) % 100}%`,
  delay: `${(i % 6) * 0.18}s`,
  color: ['#FFC94D', '#FF8A6B', '#9AD9B8', '#9CC8F5', '#C3B1F7', '#F7A8C6'][i % 6],
  size: `${10 + (i % 3) * 5}px`,
  round: i % 2 === 0,
}))

onMounted(() => {
  effect('celebrate')
  setTimeout(() => say(props.clip), 700)
})
</script>

<template>
  <div class="fixed inset-0 z-40 grid place-items-center overflow-hidden bg-cream/95 p-6" role="dialog" aria-modal="true" :aria-label="message">
    <span
      v-for="(c, i) in confetti"
      :key="i"
      class="confetti absolute -top-6 block"
      :style="{ left: c.left, animationDelay: c.delay, background: c.color, width: c.size, height: c.size, borderRadius: c.round ? '9999px' : '4px' }"
    />
    <div class="relative flex animate-pop flex-col items-center gap-6 text-center">
      <svg viewBox="0 0 120 120" class="animate-float size-40 sm:size-52" aria-hidden="true">
        <path d="m60 6 15.9 32.3 35.6 5.2-25.8 25.1 6.1 35.5L60 87.4l-31.8 16.7 6.1-35.5L8.5 43.5l35.6-5.2z" fill="#FFC94D" stroke="#2B2240" stroke-width="5" stroke-linejoin="round" />
        <circle cx="48" cy="58" r="5" fill="#2B2240" /><circle cx="72" cy="58" r="5" fill="#2B2240" />
        <ellipse cx="40" cy="70" rx="6" ry="4" fill="#FF8A6B" opacity=".7" /><ellipse cx="80" cy="70" rx="6" ry="4" fill="#FF8A6B" opacity=".7" />
        <path d="M50 70q10 10 20 0" fill="none" stroke="#2B2240" stroke-width="4" stroke-linecap="round" />
      </svg>
      <p class="text-4xl font-black tracking-tight text-ink sm:text-6xl">{{ message }}</p>
      <div class="mt-2 flex gap-6">
        <button type="button" class="toy-press grid size-24 place-items-center rounded-full bg-sunny text-ink" aria-label="Play again" @click="emit('replay')">
          <AppIcon name="replay" class="size-12" />
        </button>
        <button type="button" class="toy-press grid size-24 place-items-center rounded-full bg-white text-ink" aria-label="Home" @click="emit('home')">
          <AppIcon name="home" class="size-12" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confetti {
  animation: fall 3.2s ease-in forwards;
  opacity: 0.9;
}
@keyframes fall {
  to { transform: translateY(110vh) rotate(540deg); opacity: 0.6; }
}
</style>
