<script setup lang="ts">
import type { CollectRound, Difficulty } from '~/games/numbers/rounds'
import { collectRound } from '~/games/numbers/rounds'
import type { NumberGame } from '~/data/number-games'
import { sayNumber, sayPhrase } from '~/data/english-numbers'

/**
 * Collect and count: move things into the basket (or the fish, or onto the cake), one at a time.
 * Every thing that goes in gets the next number, said out loud, so each is counted exactly once.
 * The dashed spaces show how many are still to go. When it's full, everyone counts together.
 *
 * Super Challenge adds (3 are in, put in 2 more: 3 and 2 makes 5) and takes away (5 are in,
 * take 2 out: 5 take away 2 leaves 3), each shown in two colours.
 */
const props = defineProps<{ game: NumberGame, difficulty: Difficulty, step: number, index: number }>()
const emit = defineEmits<{ solved: [] }>()
const { say, effect } = useAudio()
const { countAloud, then, beat } = useCounting()

// Fish and cakes only get fed and topped up, never emptied, and a cake fits ten candles.
function makeRound(): CollectRound {
  let r = collectRound(props.difficulty, props.step, props.index)
  const basket = props.game.id === 'collect' || props.game.id === 'farmer'
  if (!basket && r.kind === 'takeAway') r = { kind: 'add', start: r.start - r.remove, add: r.remove, pile: r.remove + 3 }
  const cap = basket ? 15 : 10
  if (r.kind === 'collect' && r.target > cap) r = { ...r, target: cap, pile: cap + 3 }
  if (r.kind === 'add' && r.start + r.add > cap) r = { ...r, start: cap - r.add }
  return r
}
const round = makeRound()
const item = props.game.items[props.index % props.game.items.length]!
const total = round.kind === 'collect' ? round.target : round.kind === 'add' ? round.start + round.add : round.start - round.remove

type SlotState = 'empty' | 'start' | 'added' | 'gone'
const slots = ref<SlotState[]>(
  round.kind === 'collect'
    ? Array(round.target).fill('empty')
    : round.kind === 'add'
      ? [...Array(round.start).fill('start'), ...Array(round.add).fill('empty')]
      : Array(round.start).fill('start'),
)
const pile = ref<number[]>(round.kind === 'takeAway' ? [] : Array.from({ length: round.pile }, (_, i) => i))
const taken = ref(0)
const lit = ref(0)
const done = ref(false)
const showSum = ref(false)
const chomp = ref(0)

const filled = computed(() => slots.value.filter(s => s === 'start' || s === 'added').length)
/** The count shown on a slot: its place among the things still in. */
function badge(i: number) {
  const s = slots.value[i]
  if (s !== 'start' && s !== 'added') return null
  const place = slots.value.slice(0, i + 1).filter(x => x === 'start' || x === 'added').length
  if (done.value) return place <= lit.value ? place : null
  return round.kind === 'takeAway' ? null : place
}

// ---- what to say ---------------------------------------------------------------------------------

function instruction() {
  if (round.kind === 'collect') return [sayPhrase(props.game.ask), sayNumber(round.target)]
  if (round.kind === 'add') return [sayNumber(round.start), sayPhrase('addMore'), sayNumber(round.add), sayPhrase('more')]
  return [sayNumber(round.start), sayPhrase('takeAway'), sayNumber(round.remove)]
}
const instruct = () => say(instruction())
onMounted(() => setTimeout(instruct, 350))

// ---- playing ---------------------------------------------------------------------------------------

function put(id: number) {
  if (done.value || round.kind === 'takeAway') return
  const free = slots.value.indexOf('empty')
  if (free < 0) return
  pile.value = pile.value.filter(p => p !== id)
  slots.value[free] = 'added'
  chomp.value++
  effect(props.game.id === 'fish' ? 'giggle' : 'stroke')
  say(sayNumber(filled.value))
  if (!slots.value.includes('empty')) finish()
}

function takeOut(i: number) {
  if (done.value || round.kind !== 'takeAway' || slots.value[i] !== 'start') return
  slots.value[i] = 'gone'
  taken.value++
  effect('whoosh')
  say(sayNumber(taken.value))
  if (taken.value === round.remove) finish()
}

async function finish() {
  done.value = true
  await beat(700)
  if (!(await countAloud(1, total, (k) => { lit.value = k }))) return
  showSum.value = round.kind !== 'collect'
  effect('success')
  const sentence = round.kind === 'collect'
    ? [sayPhrase(props.game.cheer)]
    : round.kind === 'add'
      ? [sayNumber(round.start), sayPhrase('and'), sayNumber(round.add), sayPhrase('makes'), sayNumber(total)]
      : [sayNumber(round.start), sayPhrase('takeAway'), sayNumber(round.remove), sayPhrase('takeAwayLeaves'), sayNumber(total)]
  emit('solved')
  await then(sentence)
}

const drag = useDragDrop<number>({
  onTap: put,
  onDrop: (id, target) => { if (target === 'receiver') put(id) },
})

// ---- looks ---------------------------------------------------------------------------------------

const isFish = props.game.id === 'fish'
const isCake = props.game.id === 'birthday'
const prompt = computed(() => round.kind === 'collect' ? `${round.target}` : round.kind === 'add' ? `${round.start} + ${round.add}` : `${round.start} − ${round.remove}`)
const tilt = (id: number) => `rotate(${((id * 37) % 21) - 10}deg)`
const CANDLES = ['#74C0FC', '#FF8FA3', '#FFD43B', '#8CE99A', '#B197FC']
</script>

<template>
  <div class="flex size-full flex-col gap-2 landscape:flex-row landscape:gap-4">
    <!-- The number, the amount, and where things go -->
    <section class="flex flex-col items-center justify-center gap-2 landscape:w-[52%]">
      <button
        type="button"
        class="toy-press flex items-center gap-3 rounded-[1.75rem] bg-white/90 px-4 py-2"
        :aria-label="`${prompt}. Tap to hear again.`"
        data-prompt
        :data-kind="round.kind"
        :data-remove="round.kind === 'takeAway' ? round.remove : undefined"
        @click="instruct"
      >
        <AppIcon name="speaker" class="size-6 text-ink-soft" />
        <span class="text-[clamp(2.6rem,11vw,4rem)] font-black leading-none text-ink landscape:text-[clamp(2.4rem,10vh,3.6rem)]">
          <template v-if="showSum">{{ prompt }} = </template>{{ showSum ? total : prompt }}
        </span>
        <QuantityDots
          :n="round.kind === 'collect' ? round.target : round.kind === 'add' ? round.start + round.add : round.start"
          :a="round.kind === 'add' ? round.start : 0"
          :crossed="round.kind === 'takeAway' ? round.remove : 0"
          :size="round.kind === 'collect' && round.target <= 5 ? 18 : 14"
        />
      </button>

      <div
        data-drop="receiver"
        class="relative flex max-w-full flex-wrap items-center justify-center gap-2 rounded-[2rem] border-4 p-2 transition-colors landscape:flex-nowrap"
        :class="drag.ghost.over === 'receiver' ? 'border-sunny bg-white' : 'border-white/70 bg-white/60'"
      >
        <NumberArt
          :key="chomp"
          :kind="game.hero"
          class="shrink-0"
          :class="[isFish ? 'size-24 sm:size-32' : 'size-16 sm:size-24', chomp ? 'animate-chomp' : '', round.kind === 'takeAway' ? 'hidden' : '']"
        />
        <div class="flex flex-col items-center gap-1">
          <!-- Running count -->
          <span class="text-3xl font-black leading-none text-ink landscape:text-2xl" aria-live="polite" data-count>{{ round.kind === 'takeAway' && !done ? `−${taken}` : filled }}</span>
          <div class="relative grid gap-1 rounded-2xl p-1.5" :class="isCake ? 'mb-10 bg-rose/80 pb-2' : isFish ? 'bg-sky/70' : 'bg-[#F3D9B1]'" :style="{ gridTemplateColumns: `repeat(${Math.min(5, slots.length)}, auto)` }">
            <component
              :is="round.kind === 'takeAway' ? 'button' : 'span'"
              v-for="(s, i) in slots"
              :key="i"
              :type="round.kind === 'takeAway' ? 'button' : undefined"
              class="relative grid place-items-center rounded-xl sm:size-16"
              :class="[
                round.kind === 'takeAway' ? 'size-16' : 'size-14 landscape:!size-12',
                s === 'empty' || s === 'gone' ? 'border-2 border-dashed border-ink/20' : 'animate-pop bg-white/80',
                s === 'start' && round.kind === 'add' ? 'ring-4 ring-sky-ink/40' : '',
                s === 'added' && round.kind === 'add' ? 'ring-4 ring-coral/60' : '',
                badge(i) !== null && done ? 'scale-110 bg-sunny/70' : '',
              ]"
              :aria-label="round.kind === 'takeAway' ? (s === 'gone' ? 'Taken out' : 'Take this one out') : undefined"
              :data-slot="s"
              @click="takeOut(i)"
            >
              <NumberArt v-if="s === 'start' || s === 'added'" :kind="item" :tint="CANDLES[i % CANDLES.length]" class="size-[80%]" />
              <span v-if="badge(i) !== null" class="absolute -right-1.5 -top-1.5 grid min-w-6 place-items-center rounded-full bg-white px-1 text-sm font-black text-ink shadow">{{ badge(i) }}</span>
            </component>
            <NumberArt v-if="isCake" kind="cake" class="pointer-events-none absolute inset-x-0 -bottom-12 mx-auto h-20 w-full" preserveAspectRatio="none" />
          </div>
        </div>
      </div>
    </section>

    <!-- The things to collect (or, when taking away, the hungry friend) -->
    <section class="flex min-h-0 flex-1 items-center justify-center">
      <div
        v-if="round.kind !== 'takeAway'"
        class="flex max-h-full w-full max-w-xl flex-wrap content-center items-center justify-center gap-2 overflow-y-auto rounded-[2rem] p-3"
        :style="{ background: `${game.world.panel}cc` }"
        aria-label="Things to collect"
      >
        <button
          v-for="id in pile"
          :key="id"
          type="button"
          class="grid size-16 touch-none place-items-center rounded-2xl transition-opacity sm:size-20 landscape:max-lg:!size-16"
          :class="drag.ghost.item === id ? 'opacity-30' : ''"
          :style="{ transform: tilt(id) }"
          :aria-label="`Put one in`"
          data-pile
          @pointerdown="drag.start($event, id)"
          @click="drag.keyboard($event, id)"
        >
          <NumberArt :kind="item" :tint="CANDLES[id % CANDLES.length]" class="size-full drop-shadow" />
        </button>
        <span v-if="!pile.length" class="text-lg font-bold text-ink-soft">All gone!</span>
      </div>
      <div v-else class="flex flex-col items-center gap-2 rounded-[2rem] bg-white/70 p-4">
        <NumberArt :kind="game.id === 'farmer' ? 'hen' : 'bunny'" class="size-24 animate-float" />
        <span class="flex gap-1">
          <NumberArt v-for="k in taken" :key="k" :kind="item" class="size-10 animate-pop" />
        </span>
      </div>
    </section>

    <div v-if="drag.ghost.item !== null" class="pointer-events-none fixed z-50 scale-110" :style="drag.ghostStyle.value">
      <NumberArt :kind="item" :tint="CANDLES[(drag.ghost.item ?? 0) % CANDLES.length]" class="size-full drop-shadow-lg" />
    </div>
  </div>
</template>

<style scoped>
.animate-chomp {
  animation: chomp 0.45s ease-out;
}
@keyframes chomp {
  30% { transform: scale(1.15) rotate(-4deg); }
  60% { transform: scale(0.95) rotate(2deg); }
}
@media (prefers-reduced-motion: reduce) {
  .animate-chomp { animation: none; }
}
</style>
