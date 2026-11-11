<script setup lang="ts">
/**
 * A number as dots in ten-frames (two rows of five), the way children learn to "see" amounts:
 * 7 is a full row and two more, 13 is a full frame and three. `a` colours the first dots
 * differently (2 + 3), `crossed` fades the last ones out (5 − 2), `lit` highlights while counting.
 */
const props = withDefaults(defineProps<{ n: number, a?: number, crossed?: number, lit?: number, size?: number }>(), { a: 0, crossed: 0, lit: -1, size: 18 })

const frames = computed(() => {
  const out: number[][] = []
  for (let start = 0; start < props.n; start += 10) out.push(Array.from({ length: 10 }, (_, k) => start + k))
  return out
})
function style(i: number) {
  const filled = i < props.n
  const gone = filled && i >= props.n - props.crossed
  const lit = props.lit >= 0 && i < props.lit
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    background: !filled ? 'transparent' : gone ? '#fff' : i < props.a ? '#FF8A6B' : props.a ? '#4DABF7' : '#FF8A6B',
    border: !filled ? '2px dashed rgb(43 34 64 / 0.12)' : gone ? '2px dashed #FF8A6B' : '2px solid rgb(43 34 64 / 0.25)',
    transform: lit ? 'scale(1.25)' : undefined,
    boxShadow: lit ? '0 0 0 3px #FFC94D' : undefined,
  }
}
</script>

<template>
  <span class="inline-flex flex-wrap items-center justify-center gap-1.5" aria-hidden="true">
    <span v-for="(frame, f) in frames" :key="f" class="grid gap-[3px] rounded-lg bg-white/80 p-1" :style="{ gridTemplateColumns: `repeat(${n <= 5 ? n : 5}, auto)` }">
      <span v-for="i in (n <= 5 ? frame.slice(0, n) : frame)" :key="i" class="relative grid place-items-center rounded-full transition-transform duration-200" :style="style(i)">
        <svg v-if="i < n && i >= n - crossed" viewBox="0 0 10 10" class="size-[70%]"><path d="M2 2l6 6M8 2l-6 6" stroke="#FF8A6B" stroke-width="2" stroke-linecap="round" /></svg>
      </span>
    </span>
  </span>
</template>
