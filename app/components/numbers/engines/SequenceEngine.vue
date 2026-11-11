<script setup lang="ts">
import type { Difficulty } from '~/games/numbers/rounds'
import { sequenceRound, shuffle } from '~/games/numbers/rounds'
import type { NumberGame } from '~/data/number-games'
import { sayNumber, sayPhrase } from '~/data/english-numbers'

/**
 * Numbers in order.
 *   Number Train: drag (or tap) number cards into the empty carriages. Runs fill left to right,
 *     the next carriage glowing; missing-number trains have gaps that can be filled in any order.
 *   Number Jumping: tap the lily pads in order and the frog hops across the pond.
 * Counting up, counting back (10 9 8…) and counting in twos. A wrong number wiggles and says
 * its name; two wrong tries and the right one glows. When it's done, the whole run is counted.
 */
const props = defineProps<{ game: NumberGame, difficulty: Difficulty, step: number, index: number }>()
const emit = defineEmits<{ solved: [] }>()
const { say, effect } = useAudio()
const { countList, then, beat } = useCounting()
const DEV = import.meta.dev

const isTrain = props.game.id === 'train'
const round = sequenceRound(props.difficulty, props.step, props.index, Math.random, isTrain)
const values = round.values
const filled = ref<boolean[]>([...round.given])
const cards = ref(shuffle([...values.filter((_, k) => !round.given[k]), ...round.extras], Math.random))
const wobble = ref<{ value: number, n: number } | null>(null)
const hint = ref(false)
const lit = ref(-1)
const done = ref(false)
const leaving = ref(false)
let wrong = 0

/** The place waiting for a number: the first empty carriage, or the frog's next pad. */
const next = computed(() => filled.value.indexOf(false))

// ---- what to say ---------------------------------------------------------------------------------

function instruction() {
  const lead = round.kind === 'down' ? 'countBack' : round.kind === 'twos' ? 'countByTwos' : round.kind === 'missing' ? 'whichIsMissing' : props.game.ask
  const start = values.filter((_, k) => round.given[k])
  return [sayPhrase(lead), ...start.map(sayNumber)]
}
const instruct = () => say(instruction())
onMounted(() => setTimeout(instruct, 350))

// ---- playing ---------------------------------------------------------------------------------------

/** Try `value` at place `k` (the next place when tapped). */
function place(value: number, k = next.value) {
  if (done.value || k < 0) return
  // A missing-number train takes any right number in any gap; a run goes in order.
  if (round.kind === 'missing' && values[k] !== value) {
    const gap = values.findIndex((v, i) => v === value && !filled.value[i])
    if (gap >= 0) k = gap
  }
  if (values[k] !== value || filled.value[k] || (round.kind !== 'missing' && k !== next.value)) {
    wobble.value = { value, n: (wobble.value?.n ?? 0) + 1 }
    effect('tryAgain')
    say([sayPhrase('thats'), sayNumber(value)])
    if (++wrong >= 2) hint.value = true
    return
  }
  filled.value[k] = true
  cards.value = cards.value.filter(c => c !== value)
  hint.value = false
  wrong = 0
  effect(isTrain ? 'stroke' : 'whoosh')
  say(sayNumber(value))
  if (!filled.value.includes(false)) finish()
}

async function finish() {
  done.value = true
  await beat(isTrain ? 600 : 700)
  if (!(await countList(values, (i) => { lit.value = i }))) return
  lit.value = values.length
  leaving.value = true
  effect('success')
  emit('solved')
  await then([sayPhrase(props.game.cheer)])
}

const drag = useDragDrop<number>({
  onTap: v => place(v),
  onDrop: (v, target) => {
    if (target?.startsWith('car-')) place(v, Number(target.slice(4)))
  },
})

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
  if (isTrain || !pond.value) return
  const target = pond.value.querySelector<HTMLElement>(`[data-spot="${frogOn.value}"]`)
  if (!target) return
  const a = pond.value.getBoundingClientRect()
  const b = target.getBoundingClientRect()
  frog.value = { x: b.left - a.left + b.width / 2, y: b.top - a.top + b.height / 2, hop: frog.value.hop + 1 }
}
watch(frogOn, () => nextTick(placeFrog))
let observer: ResizeObserver | null = null
onMounted(() => {
  if (isTrain || !pond.value) return
  observer = new ResizeObserver(() => placeFrog())
  observer.observe(pond.value)
  nextTick(placeFrog)
})
onBeforeUnmount(() => observer?.disconnect())

const isLit = (k: number) => done.value && lit.value >= k
const COLOURS = ['#74C0FC', '#8CE99A', '#FFD43B', '#FF8FA3', '#B197FC', '#FFA94D']
</script>

<template>
  <div class="flex size-full flex-col gap-3">
    <!-- What to do, said again on tap -->
    <div class="flex justify-center">
      <button type="button" class="toy-press flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 font-black text-ink" data-prompt @click="instruct">
        <AppIcon name="speaker" class="size-6 text-ink-soft" />
        <span class="text-lg">{{ round.kind === 'down' ? 'Count back' : round.kind === 'twos' ? 'Count in twos' : round.kind === 'missing' ? 'What\'s missing?' : isTrain ? 'In order' : 'Jump in order' }}</span>

      </button>
    </div>

    <!-- ================= Number Train ================= -->
    <template v-if="isTrain">
      <section class="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div class="flex flex-wrap items-end justify-center gap-x-1 gap-y-4" :class="leaving && 'chug'">
          <NumberArt kind="engine" class="size-[clamp(5rem,20vw,7.5rem)] shrink-0" />
          <div
            v-for="(v, k) in values"
            :key="k"
            :data-drop="filled[k] ? undefined : `car-${k}`"
            class="relative w-[clamp(4.5rem,17vw,6.5rem)] shrink-0"
          >
            <NumberArt kind="carriage" :tint="COLOURS[k % COLOURS.length]" class="aspect-square w-full" />
            <span
              class="absolute inset-x-[12%] top-[28%] grid h-[44%] place-items-center rounded-xl text-[clamp(1.8rem,7vw,2.6rem)] font-black leading-none transition-transform"
              :class="[
                filled[k] ? 'bg-white text-ink' : 'border-4 border-dashed border-white/80 text-white/90',
                !filled[k] && k === next && round.kind !== 'missing' ? 'animate-glow' : '',
                drag.ghost.over === `car-${k}` ? 'scale-110 bg-white/60' : '',
                isLit(k) ? 'scale-110 ring-4 ring-sunny' : '',
              ]"
              :data-car="v"
              :data-filled="filled[k] ? '' : undefined"
            >{{ filled[k] ? v : '?' }}</span>
          </div>
        </div>
      </section>

      <section class="flex flex-wrap items-center justify-center gap-3 rounded-[2rem] p-3" :style="{ background: `${game.world.panel}cc` }" aria-label="Number cards">
        <button
          v-for="v in cards"
          :key="`${v}-${wobble?.value === v ? wobble.n : 0}`"
          type="button"
          class="toy-press grid size-[4.5rem] touch-none place-items-center rounded-2xl bg-white text-4xl font-black text-ink sm:size-20"
          :class="[drag.ghost.item === v && 'opacity-30', wobble?.value === v && 'animate-wiggle', hint && values[next] === v && 'animate-glow']"
          :aria-label="`Number ${v}`"
          :data-card="v"
          :data-correct="DEV && values.includes(v) ? '' : undefined"
          @pointerdown="drag.start($event, v)"
          @click="drag.keyboard($event, v)"
        >
          {{ v }}
        </button>
      </section>
      <div v-if="drag.ghost.item !== null" class="pointer-events-none fixed z-50 grid scale-110 place-items-center rounded-2xl bg-white text-4xl font-black text-ink shadow-xl" :style="drag.ghostStyle.value">
        {{ drag.ghost.item }}
      </div>
    </template>

    <!-- ================= Number Jumping ================= -->
    <section v-else ref="pond" class="relative flex min-h-0 flex-1 flex-col items-stretch justify-between gap-2 overflow-hidden rounded-[2rem] p-2 landscape:flex-row" :style="{ background: game.world.panel }">
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
.chug {
  animation: chug 2.2s ease-in 0.4s forwards;
}
@keyframes chug {
  15% { transform: translateX(-2%); }
  100% { transform: translateX(110vw); }
}
.hop {
  animation: hop 0.5s ease-out;
}
@keyframes hop {
  40% { transform: translateY(-30%) scale(1.1); }
}
@media (prefers-reduced-motion: reduce) {
  .chug, .hop { animation: none; }
}
</style>
