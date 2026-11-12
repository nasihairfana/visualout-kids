<script setup lang="ts">
import type { Difficulty } from '~/games/numbers/rounds'
import { sequenceRound, shuffle } from '~/games/numbers/rounds'
import type { NumberGame } from '~/data/number-games'
import { sayAsk, sayNumber, sayPhrase, sayThats } from '~/data/english-numbers'

/**
 * Numbers in order (Number Jumping): tap the lily pads in order and the frog hops across the pond.
 * (The Number Train has its own journey: app/components/numbers/train/.)
 * Counting up, counting back (10 9 8…) and counting in twos. A wrong number wiggles and says
 * its name; two wrong tries and the right one glows. When it's done, the whole run is counted.
 */
const props = defineProps<{ game: NumberGame, difficulty: Difficulty, step: number, index: number }>()
const emit = defineEmits<{ solved: [] }>()
const { say, effect } = useAudio()
const { countList, then, beat } = useCounting()
const DEV = import.meta.dev

const round = sequenceRound(props.difficulty, props.step, props.index, Math.random, false)
const values = round.values
const filled = ref<boolean[]>([...round.given])
const wobble = ref<{ value: number, n: number } | null>(null)
const hint = ref(false)
const lit = ref(-1)
const done = ref(false)
const leaving = ref(false)
let wrong = 0

/** The frog's next pad. */
const next = computed(() => filled.value.indexOf(false))

// ---- what to say ---------------------------------------------------------------------------------

function instruction() {
  const lead = round.kind === 'down' ? 'countBack' : round.kind === 'twos' ? 'countByTwos' : round.kind === 'missing' ? 'whichIsMissing' : props.game.ask
  const start = values.filter((_, k) => round.given[k])
  return [...sayAsk(lead), ...start.map(sayNumber)]
}
const instruct = () => say(instruction())
onMounted(() => setTimeout(instruct, 350))

// ---- playing ---------------------------------------------------------------------------------------

/** Try the pad with `value` as the frog's next jump. */
function place(value: number) {
  const k = next.value
  if (done.value || k < 0) return
  if (values[k] !== value) {
    wobble.value = { value, n: (wobble.value?.n ?? 0) + 1 }
    effect('tryAgain')
    say(sayThats(value))
    if (++wrong >= 2) hint.value = true
    return
  }
  filled.value[k] = true
  hint.value = false
  wrong = 0
  effect('whoosh')
  say(sayNumber(value))
  if (!filled.value.includes(false)) finish()
}

async function finish() {
  done.value = true
  await beat(700)
  if (!(await countList(values, (i) => { lit.value = i }))) return
  lit.value = values.length
  leaving.value = true
  effect('success')
  emit('solved')
  await then([sayPhrase(props.game.cheer)])
}

// ---- the frog ------------------------------------------------------------------------------------

const pond = ref<HTMLElement | null>(null)
const pads = shuffle([...values.map((v, k) => ({ v, k })).filter(p => !round.given[p.k]), ...round.extras.map(v => ({ v, k: -1 }))], Math.random)
const frog = ref({ x: 0, y: 0, hop: 0 })
const frogOn = computed(() => {
  if (leaving.value) return 'goal'
  const last = next.value === -1 ? values.length - 1 : next.value - 1
  return last < 0 || round.given[last] ? 'start' : `pad-${values[last]}`
})
const givenRun = values.filter((_, k) => round.given[k])

function placeFrog() {
  if (!pond.value) return
  const target = pond.value.querySelector<HTMLElement>(`[data-spot="${frogOn.value}"]`)
  if (!target) return
  const a = pond.value.getBoundingClientRect()
  const b = target.getBoundingClientRect()
  frog.value = { x: b.left - a.left + b.width / 2, y: b.top - a.top + b.height / 2, hop: frog.value.hop + 1 }
}
watch(frogOn, () => nextTick(placeFrog))
let observer: ResizeObserver | null = null
onMounted(() => {
  if (!pond.value) return
  observer = new ResizeObserver(() => placeFrog())
  observer.observe(pond.value)
  nextTick(placeFrog)
})
onBeforeUnmount(() => observer?.disconnect())

const isLit = (k: number) => done.value && lit.value >= k
</script>

<template>
  <div class="flex size-full flex-col gap-3">
    <!-- What to do, said again on tap -->
    <div class="flex justify-center">
      <button type="button" class="toy-press flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 font-black text-ink" data-prompt @click="instruct">
        <AppIcon name="speaker" class="size-6 text-ink-soft" />
        <span class="text-lg">{{ round.kind === 'down' ? 'Count back' : round.kind === 'twos' ? 'Count in twos' : 'Jump in order' }}</span>

      </button>
    </div>

    <!-- ================= Number Jumping ================= -->
    <section ref="pond" class="relative flex min-h-0 flex-1 flex-col items-stretch justify-between gap-2 overflow-hidden rounded-[2rem] p-2 landscape:flex-row" :style="{ background: game.world.panel }">
      <!-- Start bank -->
      <div class="flex shrink-0 items-center justify-center gap-2 rounded-3xl bg-[#9FDB8B] p-2 landscape:order-first landscape:flex-col" data-spot="start">
        <span v-for="v in givenRun" :key="v" class="grid size-14 place-items-center rounded-full bg-[#CED4DA] text-2xl font-black text-ink" :class="isLit(values.indexOf(v)) && 'ring-4 ring-sunny'">{{ v }}</span>
        <span v-if="!givenRun.length" class="size-14" />
      </div>

      <!-- Lily pads -->
      <div class="flex min-h-0 flex-1 flex-wrap content-center items-center justify-center gap-x-3 gap-y-2">
        <button
          v-for="(pad, i) in pads"
          :key="`${pad.v}-${wobble?.value === pad.v ? wobble.n : 0}`"
          type="button"
          class="relative grid size-[clamp(5rem,21vw,6.5rem)] place-items-center transition-transform"
          :class="[
            wobble?.value === pad.v && 'animate-wiggle',
            hint && values[next] === pad.v && 'animate-glow rounded-full',
            isLit(pad.k) && 'scale-110',
          ]"
          :style="{ marginTop: i % 2 ? '1.25rem' : '-0.5rem' }"
          :aria-label="`Lily pad ${pad.v}`"
          :data-spot="`pad-${pad.v}`"
          :data-pad="pad.v"
          :data-step="DEV && pad.k >= 0 ? pad.k : undefined"
          @click="place(pad.v)"
        >
          <NumberArt kind="lilypad" class="absolute inset-0 size-full" :class="pad.k >= 0 && filled[pad.k] && 'brightness-90'" />
          <span class="relative rounded-xl bg-white/85 px-2 text-3xl font-black text-ink" :class="pad.k >= 0 && filled[pad.k] && 'ring-4 ring-sunny'">{{ pad.v }}</span>
        </button>
      </div>

      <!-- Far bank -->
      <div class="flex shrink-0 items-center justify-center rounded-3xl bg-[#9FDB8B] p-2" data-spot="goal">
        <NumberArt kind="flower" class="size-14" />
      </div>

      <!-- The frog -->
      <div
        class="pointer-events-none absolute left-0 top-0 size-16 transition-transform duration-500 ease-out motion-reduce:transition-none"
        :style="{ transform: `translate(${frog.x - 32}px, ${frog.y - 52}px)` }"
        aria-hidden="true"
        data-frog
      >
        <NumberArt :key="frog.hop" kind="frog" class="hop size-full drop-shadow-md" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.hop {
  animation: hop 0.5s ease-out;
}
@keyframes hop {
  40% { transform: translateY(-30%) scale(1.1); }
}
@media (prefers-reduced-motion: reduce) {
  .hop { animation: none; }
}
</style>
