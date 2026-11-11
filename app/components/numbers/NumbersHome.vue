<script setup lang="ts">
import type { Difficulty } from '~/games/numbers/rounds'
import { NUMBER_GAMES } from '~/data/number-games'

/**
 * Numbers & Counting home: how hard (applies to every adventure), then the eleven adventures.
 * Locked ones show how many stars open them. A button hops across to My First ABC; the parent
 * entry is the same press-and-hold as in My First ABC.
 */
const progress = useNumbersProgress()
const { effect, stop } = useAudio()

const LEVELS: Array<{ id: Difficulty, label: string, range: string, stars: number, tone: string }> = [
  { id: 'beginner', label: 'Beginner', range: '1–5', stars: 1, tone: 'bg-mint text-mint-ink' },
  { id: 'challenge', label: 'Challenge', range: '1–10', stars: 2, tone: 'bg-sky text-sky-ink' },
  { id: 'super', label: 'Super Challenge', range: '1–20', stars: 3, tone: 'bg-lilac text-lilac-ink' },
]

function choose(d: Difficulty) {
  effect('tap')
  progress.difficulty.value = d
}

function open(gameId: string) {
  if (!progress.isUnlocked(gameId)) {
    effect('tryAgain')
    return
  }
  stop()
  effect('page')
  navigateTo(`/numbers/${gameId}`)
}

function go(path: string) {
  stop()
  effect('page')
  navigateTo(path)
}
</script>

<template>
  <div class="safe-screen flex flex-col gap-3 overflow-y-auto">
    <header class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <span class="grid size-14 shrink-0 place-items-center rounded-2xl bg-sunny text-xl font-black tracking-tighter text-ink shadow-sm" aria-hidden="true">123</span>
        <div class="min-w-0 leading-tight">
          <p class="text-sm font-bold uppercase tracking-[0.2em] text-ink-soft">Visualout Kids</p>
          <h1 class="text-[1.6rem] font-black leading-none text-ink sm:text-4xl">Numbers &amp; Counting</h1>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <span class="hidden items-center gap-1.5 rounded-full bg-white py-1.5 pl-2 pr-4 text-lg font-black text-ink shadow-sm sm:flex" role="img" :aria-label="`${progress.totalStars.value} stars`" data-stars>
          <AppIcon name="star" class="size-8 text-sunny" />{{ progress.totalStars.value }}
        </span>
        <SoundToggle />
      </div>
    </header>

    <!-- How hard: one choice for every adventure -->
    <section class="grid grid-cols-3 gap-2" aria-label="How hard">
      <button
        v-for="d in LEVELS"
        :key="d.id"
        type="button"
        class="toy-press flex min-h-16 flex-col items-center justify-center rounded-3xl px-2 py-1.5 sm:flex-row sm:gap-3"
        :class="[d.tone, progress.difficulty.value === d.id ? 'ring-4 ring-sunny' : 'opacity-75']"
        :aria-pressed="progress.difficulty.value === d.id"
        :aria-label="`${d.label}, numbers ${d.range}`"
        :data-difficulty="d.id"
        @click="choose(d.id)"
      >
        <span class="flex" aria-hidden="true"><AppIcon v-for="n in d.stars" :key="n" name="star" class="size-5 text-sunny drop-shadow-sm sm:size-6" /></span>
        <span class="text-center font-black leading-tight sm:text-lg">{{ d.label }}</span>
        <span class="whitespace-nowrap text-xs font-bold opacity-80 sm:text-sm">{{ d.range }}</span>
      </button>
    </section>

    <!-- The adventures -->
    <main class="grid flex-1 grid-cols-2 content-start gap-3 sm:grid-cols-3 landscape:grid-cols-4 lg:grid-cols-4">
      <button
        v-for="g in NUMBER_GAMES"
        :key="g.id"
        type="button"
        class="toy-press relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-[2rem] p-3"
        :class="progress.isUnlocked(g.id) ? g.tone : 'bg-[#E9ECEF] text-ink-soft'"
        :aria-label="progress.isUnlocked(g.id) ? g.title : `${g.title}: needs ${g.unlockAt} stars`"
        :data-game="g.id"
        @click="open(g.id)"
      >
        <span :class="!progress.isUnlocked(g.id) && 'opacity-50 grayscale'" class="w-full">
          <NumberGameCard :game="g" />
        </span>
        <span class="text-center text-lg font-black leading-tight">{{ g.title }}</span>
        <span v-if="progress.starsFor(g.id)" class="flex items-center gap-0.5 text-sm font-black" :aria-label="`${progress.starsFor(g.id)} stars`">
          <AppIcon name="star" class="size-4 text-sunny" />{{ progress.starsFor(g.id) }}
        </span>
        <span v-if="!progress.isUnlocked(g.id)" class="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-white px-2 py-0.5 text-sm font-black text-ink shadow-sm">
          <AppIcon name="lock" class="size-4" /><AppIcon name="star" class="size-4 text-sunny" />{{ g.unlockAt }}
        </span>
      </button>
    </main>

    <footer class="flex items-center justify-between gap-3">
      <ParentGate @unlock="go('/numbers/parents')" />
      <button type="button" class="toy-press flex min-h-16 items-center gap-2 rounded-full bg-peach px-5 text-xl font-black text-peach-ink" aria-label="My First ABC" data-switch="abc" @click="go('/abc')">
        <span aria-hidden="true">A b c</span>
        <AppIcon name="next" class="size-6" />
      </button>
    </footer>
  </div>
</template>
