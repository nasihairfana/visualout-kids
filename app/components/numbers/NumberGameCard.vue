<script setup lang="ts">
import type { NumberGame } from '~/data/number-games'

/** A little picture of each adventure, so a non-reader can tell them apart. */
defineProps<{ game: NumberGame }>()
const chip = 'grid place-items-center rounded-lg bg-white font-black text-ink shadow-sm'
</script>

<template>
  <span class="relative flex h-[clamp(4rem,11vh,6rem)] w-full items-center justify-center gap-1" aria-hidden="true">
    <template v-if="game.id === 'collect'">
      <NumberArt kind="bunny" class="h-full w-auto" />
      <span class="flex flex-col items-center"><span class="text-3xl font-black leading-none">3</span><NumberArt kind="basket" class="size-12" /></span>
      <span class="flex flex-col"><NumberArt kind="apple" class="size-6" /><NumberArt kind="apple" class="size-6" /><NumberArt kind="apple" class="size-6" /></span>
    </template>
    <template v-else-if="game.id === 'balloons'">
      <span v-for="(b, i) in [['2', '#FF8FA3'], ['5', '#74C0FC'], ['3', '#FFD43B']]" :key="i" class="relative h-full w-[28%] animate-float" :style="{ animationDelay: `${-i}s` }">
        <NumberArt kind="balloon" :tint="b[1]" class="size-full" />
        <span class="absolute inset-x-0 top-[22%] text-center text-2xl font-black">{{ b[0] }}</span>
      </span>
    </template>
    <template v-else-if="game.id === 'fish'">
      <NumberArt kind="bigfish" class="h-full w-auto" />
      <span class="flex gap-0.5"><NumberArt v-for="k in 3" :key="k" kind="pellet" class="size-6" /></span>
    </template>
    <template v-else-if="game.id === 'matching'">
      <span :class="chip" class="size-12 text-3xl">3</span>
      <AppIcon name="next" class="size-6" />
      <span class="flex flex-wrap justify-center gap-0.5 w-16"><NumberArt v-for="k in 3" :key="k" kind="butterfly" class="size-7" /></span>
    </template>
    <template v-else-if="game.id === 'train'">
      <NumberArt kind="engine" class="h-[80%] w-auto" />
      <span v-for="n in 3" :key="n" class="relative h-[70%] w-[18%]">
        <NumberArt kind="carriage" :tint="['#74C0FC', '#8CE99A', '#FFD43B'][n - 1]" class="size-full" />
        <span class="absolute inset-x-0 top-[22%] text-center text-xl font-black">{{ n }}</span>
      </span>
    </template>
    <template v-else-if="game.id === 'frog'">
      <NumberArt kind="frog" class="h-[75%] w-auto" />
      <span v-for="n in 3" :key="n" class="relative size-12" :style="{ marginTop: n % 2 ? '1.5rem' : '-1rem' }">
        <NumberArt kind="lilypad" class="size-full" />
        <span class="absolute inset-0 grid place-items-center text-xl font-black">{{ n }}</span>
      </span>
    </template>
    <template v-else-if="game.id === 'farmer'">
      <NumberArt kind="farmer" class="h-full w-auto" />
      <span class="flex flex-col items-center"><span class="text-3xl font-black leading-none">4</span><span class="flex"><NumberArt v-for="k in 4" :key="k" kind="egg" class="size-6" /></span></span>
    </template>
    <template v-else-if="game.id === 'fishing'">
      <span v-for="(f, i) in [['4', '#FFA94D'], ['7', '#74C0FC']]" :key="i" class="relative h-[62%] w-[40%]" :style="{ marginTop: i ? '2rem' : '-1.5rem' }">
        <NumberArt kind="fish" :tint="f[1]" :flip="i === 1" class="size-full" />
        <span class="absolute inset-0 grid place-items-center text-2xl font-black">{{ f[0] }}</span>
      </span>
    </template>
    <template v-else-if="game.id === 'birthday'">
      <NumberArt kind="bear" class="h-[85%] w-auto" />
      <span class="relative flex h-full w-[45%] flex-col justify-end">
        <span class="flex justify-center"><NumberArt v-for="k in 3" :key="k" kind="candle" :tint="['#74C0FC', '#FF8FA3', '#FFD43B'][k - 1]" class="size-7" /></span>
        <NumberArt kind="cake" class="-mt-3 h-10 w-full" />
      </span>
    </template>
    <template v-else-if="game.id === 'parking'">
      <span class="relative h-[70%] w-[45%]">
        <NumberArt kind="car" tint="#FF6B6B" class="size-full" />
        <span class="absolute inset-x-0 top-[30%] text-center text-xl font-black text-white [text-shadow:0_1px_0_#2B2240]">5</span>
      </span>
      <span class="grid size-14 place-items-center rounded-lg border-4 border-dashed border-white bg-ink/60 text-2xl font-black text-white">5</span>
    </template>
    <template v-else-if="game.id === 'space'">
      <NumberArt kind="rocket" class="h-full w-auto rotate-12" />
      <span v-for="(p, i) in [['8', '#B197FC'], ['9', '#FF8FA3']]" :key="i" class="relative size-12" :style="{ marginTop: i ? '1.5rem' : '-1.5rem' }">
        <NumberArt kind="planet" :tint="p[1]" class="size-full" />
        <span class="absolute inset-0 grid place-items-center text-xl font-black text-ink">{{ p[0] }}</span>
      </span>
    </template>
  </span>
</template>
