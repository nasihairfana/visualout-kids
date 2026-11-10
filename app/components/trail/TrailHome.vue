<script setup lang="ts">
import type { Difficulty } from '~/games/trail/levels'
import { TRAIL_THEMES, themeById } from '~/data/trail-themes'

/**
 * Letter Trails map: pick a friend (a world), then how hard. Locked worlds show how many stars
 * open them. Difficulty buttons carry 1, 2 or 3 stars so a non-reader can tell them apart.
 */
const progress = useTrailProgress()
const { effect, stop } = useAudio()

const chosen = computed(() => (progress.isUnlocked(progress.theme.value) ? themeById(progress.theme.value) : TRAIL_THEMES[0]!))

function choose(id: string) {
  if (!progress.isUnlocked(id)) {
    effect('tryAgain')
    return
  }
  effect('tap')
  progress.theme.value = id
}

const LEVELS: Array<{ id: Difficulty, label: string, stars: number, tone: string }> = [
  { id: 'beginner', label: 'Beginner', stars: 1, tone: 'bg-mint text-mint-ink' },
  { id: 'challenge', label: 'Challenge', stars: 2, tone: 'bg-sky text-sky-ink' },
  { id: 'super', label: 'Super Challenge', stars: 3, tone: 'bg-lilac text-lilac-ink' },
]

function play(difficulty: Difficulty) {
  stop()
  effect('page')
  navigateTo({ path: '/abc/trail/play', query: { difficulty, world: chosen.value.id } })
}
</script>

<template>
  <div class="safe-screen relative flex flex-col gap-3 overflow-y-auto">
    <TrailScenery :theme="chosen" />

    <div class="relative z-10">
      <GameTopBar>
        <span class="flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-2 pr-4 text-lg font-black text-ink shadow-sm" role="img" :aria-label="`${progress.totalStars.value} stars`">
          <AppIcon name="star" class="size-8 text-sunny" />{{ progress.totalStars.value }}
        </span>
      </GameTopBar>
    </div>

    <main class="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 landscape:flex-row landscape:items-stretch landscape:gap-6">
      <!-- Friends -->
      <section class="w-full max-w-xl rounded-[2rem] bg-white/85 p-3 shadow-sm landscape:max-w-[58%]" aria-label="Choose a friend">
        <h1 class="mb-2 text-center text-2xl font-black text-ink">Letter Trails</h1>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="t in TRAIL_THEMES"
            :key="t.id"
            type="button"
            class="toy-press relative flex aspect-square min-h-16 flex-col landscape:aspect-auto landscape:h-[min(21vh,6.5rem)] items-center justify-center rounded-2xl p-1"
            :class="[
              chosen.id === t.id ? 'ring-4 ring-sunny' : '',
              progress.isUnlocked(t.id) ? '' : 'opacity-70',
            ]"
            :style="{ background: progress.isUnlocked(t.id) ? t.colors.map : '#E9ECEF' }"
            :aria-label="progress.isUnlocked(t.id) ? t.title : `${t.title}: needs ${t.unlockAt} stars`"
            :aria-pressed="chosen.id === t.id"
            :data-world="t.id"
            @click="choose(t.id)"
          >
            <TrailArt :kind="t.hero" class="size-[70%]" :class="!progress.isUnlocked(t.id) && 'grayscale'" />
            <span v-if="!progress.isUnlocked(t.id)" class="absolute bottom-1 flex items-center gap-0.5 rounded-full bg-white px-1.5 text-xs font-black text-ink shadow-sm">
              <AppIcon name="lock" class="size-3.5" />{{ t.unlockAt }}
            </span>
          </button>
        </div>
        <p class="mt-2 flex items-center justify-center gap-2 text-center font-bold text-ink-soft">
          <TrailArt :kind="chosen.hero" class="size-8" />
          {{ chosen.title }}
          <TrailArt :kind="chosen.goal" class="size-8" />
        </p>
      </section>

      <!-- How hard -->
      <section class="flex w-full max-w-xl flex-col gap-3 landscape:w-auto landscape:min-w-[16rem] landscape:justify-center" aria-label="Choose how hard">
        <button
          v-for="d in LEVELS"
          :key="d.id"
          type="button"
          class="toy-press flex min-h-20 items-center justify-between gap-3 rounded-[1.75rem] px-5"
          :class="d.tone"
          :aria-label="`${d.label}, level ${progress.levelOf(d.id)}`"
          :data-difficulty="d.id"
          @click="play(d.id)"
        >
          <span class="flex gap-0.5" aria-hidden="true"><AppIcon v-for="n in d.stars" :key="n" name="star" class="size-7 text-sunny drop-shadow-sm" /></span>
          <span class="text-center text-xl font-black leading-tight">{{ d.label }}</span>
          <span class="shrink-0 whitespace-nowrap rounded-full bg-white/80 px-3 py-1 text-sm font-black">Lv {{ progress.levelOf(d.id) }}</span>
        </button>
      </section>
    </main>
  </div>
</template>
