<script setup lang="ts">
import type { NumberGame } from '~/data/number-games'
import { STARS_PER_SESSION } from '~/composables/useNumbersProgress'
import { sayPhrase } from '~/data/english-numbers'

/**
 * After five rounds: the adventure's friend, the stars earned, and any adventure that just
 * opened. Then play again (the big button) or back to all the adventures.
 */
const props = defineProps<{ game: NumberGame, unlocked: NumberGame[] }>()
const emit = defineEmits<{ replay: [], home: [] }>()
const { say } = useAudio()
onMounted(() => say(sayPhrase(props.game.cheer === 'yum' ? 'greatCounting' : props.game.cheer)))

const confetti = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 47) % 100}%`,
  delay: `${(i % 7) * 0.15}s`,
  color: ['#FFC94D', '#FF8A6B', '#9AD9B8', '#9CC8F5', '#C3B1F7', '#F7A8C6'][i % 6],
  size: `${10 + (i % 3) * 5}px`,
  round: i % 2 === 0,
}))
</script>

<template>
  <div class="fixed inset-0 z-40 grid place-items-center overflow-hidden bg-cream/95 p-6" role="dialog" aria-modal="true" aria-label="Great counting!">
    <span
      v-for="(c, i) in confetti"
      :key="i"
      class="confetti absolute -top-6 block"
      :style="{ left: c.left, animationDelay: c.delay, background: c.color, width: c.size, height: c.size, borderRadius: c.round ? '9999px' : '4px' }"
    />
    <div class="relative flex max-h-full animate-pop flex-col items-center gap-4 overflow-y-auto text-center landscape:gap-2">
      <NumberArt :kind="game.hero" class="size-32 animate-bounce-soft landscape:size-20 sm:size-40" tint="#74C0FC" aria-hidden="true" />

      <div class="flex items-end gap-2" role="img" :aria-label="`${STARS_PER_SESSION} stars`">
        <AppIcon
          v-for="n in STARS_PER_SESSION"
          :key="n"
          name="star"
          class="animate-pop text-sunny drop-shadow [animation-fill-mode:both]"
          :class="n === 2 ? 'size-20 landscape:size-14' : 'size-14 landscape:size-10'"
          :style="{ animationDelay: `${0.25 + n * 0.2}s` }"
        />
      </div>

      <p class="text-3xl font-black tracking-tight text-ink sm:text-5xl landscape:text-3xl">Great counting!</p>
      <p class="text-lg font-bold text-ink-soft">{{ game.title }}</p>

      <div v-for="g in unlocked" :key="g.id" class="flex animate-pop items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 shadow-md [animation-delay:900ms] [animation-fill-mode:both]" data-unlocked>
        <NumberArt :kind="g.hero" class="size-12" tint="#FF8FA3" />
        <span class="text-left font-black leading-tight text-ink">New adventure!<br><span class="text-sm font-bold text-ink-soft">{{ g.title }}</span></span>
      </div>

      <div class="mt-2 flex items-center gap-5">
        <button type="button" class="toy-press grid size-24 place-items-center rounded-full bg-sunny text-ink" aria-label="Play again" @click="emit('replay')">
          <AppIcon name="replay" class="size-12" />
        </button>
        <button type="button" class="toy-press grid size-20 place-items-center rounded-full bg-white text-ink" aria-label="All the adventures" @click="emit('home')">
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
