<script setup lang="ts">
import type { NumberWorld } from '~/data/number-games'

/**
 * The world behind a Numbers adventure: sky (or sea, or space), ground, and decorations at the
 * edges of the screen. All behind the play area, so numbers are never covered.
 */
const props = defineProps<{ world: NumberWorld }>()

const SPOTS: Array<[number, number, number]> = [
  [-2, 6, 15], [46, -2, 11], [85, 4, 16],
  [-4, 42, 16], [91, 46, 16],
  [-3, 80, 18], [24, 88, 13], [64, 89, 13], [87, 82, 18],
]
const FLOATS = new Set(['cloud', 'balloon', 'sun', 'bubble', 'twinkle', 'moon', 'planet'])
const TINTS = ['#FF8FA3', '#74C0FC', '#FFD43B', '#8CE99A', '#B197FC']
const pieces = computed(() => props.world.scenery.map((kind, i) => {
  const [left, top, size] = SPOTS[i % SPOTS.length]!
  return { kind, left, top, size, flip: i % 2 === 1, float: FLOATS.has(kind), tint: TINTS[i % TINTS.length] }
}))
const background = computed(() => {
  const { skyTop, skyBottom, ground, horizon } = props.world
  return horizon >= 100
    ? `radial-gradient(circle at 70% 20%, ${skyBottom}, ${skyTop} 70%)`
    : `linear-gradient(${skyTop}, ${skyBottom} ${horizon}%, ${ground} ${horizon}%)`
})
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" :style="{ background }">
    <svg v-if="world.horizon < 100" class="absolute inset-x-0 h-[12%] w-full" :style="{ top: `${world.horizon - 8}%` }" viewBox="0 0 400 60" preserveAspectRatio="none">
      <path d="M0 40C40 10 90 10 130 30s90 20 130-4 100-26 140 4v30H0z" :fill="world.ground" />
    </svg>
    <div
      v-for="(p, i) in pieces"
      :key="i"
      class="absolute"
      :class="p.float && 'animate-float'"
      :style="{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.size}vmin`, height: `${p.size}vmin`, animationDelay: `${-i * 0.7}s` }"
    >
      <NumberArt :kind="p.kind" :flip="p.flip" :tint="p.tint" class="size-full" />
    </div>
  </div>
</template>
