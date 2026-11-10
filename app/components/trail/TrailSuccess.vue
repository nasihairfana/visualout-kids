<script setup lang="ts">
import type { TrailTheme } from '~/data/trail-themes'
import { STARS_PER_LEVEL } from '~/composables/useTrailProgress'

/**
 * After a level: the animal with its goal, the stars earned, and a new friend if one just
 * opened up. Then: next level (the big button), play it again, or back to the map.
 */
defineProps<{ theme: TrailTheme, level: number, unlocked: TrailTheme[] }>()
const emit = defineEmits<{ next: [], replay: [], home: [] }>()

const confetti = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 47) % 100}%`,
  delay: `${(i % 7) * 0.15}s`,
  color: ['#FFC94D', '#FF8A6B', '#9AD9B8', '#9CC8F5', '#C3B1F7', '#F7A8C6'][i % 6],
  size: `${10 + (i % 3) * 5}px`,
  round: i % 2 === 0,
}))
</script>

<template>
  <div class="fixed inset-0 z-40 grid place-items-center overflow-hidden bg-cream/95 p-6" role="dialog" aria-modal="true" aria-label="You found the way!">
    <span
      v-for="(c, i) in confetti"
      :key="i"
      class="confetti absolute -top-6 block"
      :style="{ left: c.left, animationDelay: c.delay, background: c.color, width: c.size, height: c.size, borderRadius: c.round ? '9999px' : '4px' }"
    />
    <div class="relative flex max-h-full animate-pop flex-col items-center gap-4 overflow-y-auto text-center landscape:gap-2">
      <div class="flex items-end gap-2" aria-hidden="true">
        <TrailArt :kind="theme.hero" class="size-28 animate-bounce-soft landscape:size-20 sm:size-36" />
        <span class="mb-6 text-4xl text-coral">♥</span>
        <TrailArt :kind="theme.goal" :flip="true" class="size-28 landscape:size-20 sm:size-36" />
      </div>

      <div class="flex items-end gap-2" role="img" :aria-label="`${STARS_PER_LEVEL} stars`">
        <AppIcon
          v-for="n in STARS_PER_LEVEL"
          :key="n"
          name="star"
          class="animate-pop text-sunny drop-shadow [animation-fill-mode:both]"
          :class="n === 2 ? 'size-20 landscape:size-14' : 'size-14 landscape:size-10'"
          :style="{ animationDelay: `${0.25 + n * 0.2}s` }"
        />
      </div>

      <p class="text-3xl font-black tracking-tight text-ink sm:text-5xl landscape:text-3xl">You found the way!</p>
      <p class="text-lg font-bold text-ink-soft">Level {{ level }}</p>

      <!-- A new world just opened -->
      <div v-for="t in unlocked" :key="t.id" class="flex animate-pop items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 shadow-md [animation-delay:900ms] [animation-fill-mode:both]">
        <TrailArt :kind="t.hero" class="size-12" />
        <span class="text-left font-black leading-tight text-ink">New friend!<br><span class="text-sm font-bold text-ink-soft">{{ t.title }}</span></span>
      </div>

      <div class="mt-2 flex items-center gap-5">
        <button type="button" class="toy-press grid size-20 place-items-center rounded-full bg-white text-ink" aria-label="Play this level again" @click="emit('replay')">
          <AppIcon name="replay" class="size-10" />
        </button>
        <button type="button" class="toy-press grid size-24 place-items-center rounded-full bg-sunny text-ink" aria-label="Next level" @click="emit('next')">
          <AppIcon name="next" class="size-12 animate-nudge" />
        </button>
        <button type="button" class="toy-press grid size-20 place-items-center rounded-full bg-white text-ink" aria-label="Back to the map" @click="emit('home')">
          <AppIcon name="home" class="size-10" />
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
@media (prefers-reduced-motion: reduce) {
  .confetti { display: none; }
}
</style>
