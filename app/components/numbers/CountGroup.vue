<script setup lang="ts">
import type { NumberArtKind } from '~/data/number-games'
import { sayNumber } from '~/data/english-numbers'

/**
 * A group of things to count, in rows of five. With `countable`, tapping a thing counts it:
 * it lights up with its number and the number is said. Each thing counts once, so tapping it
 * again doesn't change the count (one-to-one counting). `lit` lights the first things from
 * outside, for counting along with the game.
 */
const props = withDefaults(defineProps<{ n: number, kind: NumberArtKind, size?: number, countable?: boolean, lit?: number, tens?: boolean }>(), { size: 40, countable: false, lit: 0, tens: false })
const emit = defineEmits<{ counted: [count: number] }>()
const { say, effect } = useAudio()

const order = ref<number[]>([])
watch(() => [props.n, props.kind], () => { order.value = [] })

const numberOn = (i: number) => {
  const k = order.value.indexOf(i)
  if (k >= 0) return k + 1
  return i < props.lit ? i + 1 : null
}

function count(i: number) {
  if (!props.countable) return
  if (order.value.includes(i)) {
    effect('tap')
    return
  }
  order.value.push(i)
  effect('stroke')
  say(sayNumber(order.value.length))
  emit('counted', order.value.length)
}

// With `tens`, the first ten sit in their own frame, so 13 reads as "ten and three".
const rows = computed(() => {
  const out: number[][] = []
  const firstTen = props.tens && props.n > 10 ? 10 : 0
  if (firstTen) out.push(Array.from({ length: 10 }, (_, k) => k))
  for (let start = firstTen; start < props.n; start += 5) out.push(Array.from({ length: Math.min(5, props.n - start) }, (_, k) => start + k))
  return out
})
</script>

<template>
  <div class="flex flex-col items-center gap-1.5">
    <div
      v-for="(row, r) in rows"
      :key="r"
      class="flex flex-wrap justify-center gap-1"
      :class="tens && n > 10 && r === 0 && 'grid grid-cols-5 rounded-2xl bg-white/70 p-1 ring-2 ring-sunny'"
    >
      <component
        :is="countable ? 'button' : 'span'"
        v-for="i in row"
        :key="i"
        :type="countable ? 'button' : undefined"
        class="relative grid place-items-center rounded-2xl transition-transform duration-200"
        :class="numberOn(i) !== null ? 'scale-110 bg-sunny/70' : ''"
        :style="{ width: `${countable ? Math.max(size, 56) : size}px`, height: `${countable ? Math.max(size, 56) : size}px` }"
        :aria-label="countable ? (numberOn(i) !== null ? `Counted ${numberOn(i)}` : 'Count this one') : undefined"
        data-countable
        @click="count(i)"
      >
        <NumberArt :kind="kind" class="size-[86%]" />
        <span v-if="numberOn(i) !== null" class="absolute -right-1 -top-1 grid min-w-6 place-items-center rounded-full bg-white px-1 text-sm font-black text-ink shadow">{{ numberOn(i) }}</span>
      </component>
    </div>
  </div>
</template>
