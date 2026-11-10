<script setup lang="ts">
import type { TrailTheme } from '~/data/trail-themes'

/**
 * The world around the map: sky, a soft rolling ground, and decorations peeking in from the
 * edges. Everything sits behind the map panel, so it never covers a letter.
 */
const props = defineProps<{ theme: TrailTheme }>()

// Spots around the edge of the screen, as [left %, top %, size in vmin].
const SPOTS: Array<[number, number, number]> = [
  [-2, 4, 16], [44, -3, 12], [84, 2, 17],
  [-5, 40, 18], [90, 44, 18],
  [-3, 78, 20], [26, 86, 15], [62, 88, 15], [86, 80, 20],
]
const pieces = computed(() => props.theme.scenery.map((kind, i) => {
  const [left, top, size] = SPOTS[i % SPOTS.length]!
  return { kind, left, top, size, flip: i % 2 === 1, float: kind === 'cloud' || kind === 'balloon' || kind === 'sun' }
}))
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" :style="{ background: `linear-gradient(${theme.colors.skyTop}, ${theme.colors.skyBottom} 55%, ${theme.colors.ground} 55%)` }">
    <!-- Rolling hills where the sky meets the ground -->
    <svg class="absolute inset-x-0 top-[47%] h-[14%] w-full" viewBox="0 0 400 60" preserveAspectRatio="none">
      <path d="M0 40C40 10 90 10 130 30s90 20 130-4 100-26 140 4v30H0z" :fill="theme.colors.ground" />
    </svg>
    <div
      v-for="(p, i) in pieces"
      :key="i"
      class="absolute"
      :class="p.float && 'animate-float'"
      :style="{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.size}vmin`, height: `${p.size}vmin`, animationDelay: `${-i * 0.7}s` }"
    >
      <TrailArt :kind="p.kind" :flip="p.flip" class="size-full" />
    </div>
  </div>
</template>
