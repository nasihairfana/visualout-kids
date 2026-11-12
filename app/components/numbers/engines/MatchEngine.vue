<script setup lang="ts">
import type { Difficulty, MatchGroup } from '~/games/numbers/rounds'
import { matchRound, shuffle } from '~/games/numbers/rounds'
import type { NumberGame } from '~/data/number-games'
import { sayAsk, sayNumber, sayPhrase, sayThats } from '~/data/english-numbers'

/**
 * Match each number to the group with that many: 3 goes with three butterflies. Drag a number
 * onto a group, or tap one and then the other. Tapping a group first counts it out loud, so a
 * child can count before choosing. In Number Parking the numbers are cars and the groups are
 * painted on the parking spaces. Super Challenge groups are a full ten and some more, or two
 * colours (4 and 3) to count together.
 */
const props = defineProps<{ game: NumberGame, difficulty: Difficulty, step: number, index: number }>()
const emit = defineEmits<{ solved: [] }>()
const { say, effect } = useAudio()
const { countAloud, then, beat } = useCounting()

const isParking = props.game.id === 'parking'
const round = matchRound(props.difficulty, props.step, props.index)
const groups = shuffle(round.groups, Math.random)
const numbers = shuffle(round.groups.map(g => g.n), Math.random)
const thing = props.game.items[props.index % props.game.items.length]!

const matched = ref<number[]>([])
const selected = ref<{ kind: 'number' | 'group', n: number } | null>(null)
const counting = ref<{ n: number, k: number } | null>(null)
const wobble = ref<{ n: number, t: number } | null>(null)
const hintFor = ref<number | null>(null)
const done = ref(false)
let wrong = 0

const instruct = () => say(sayAsk(props.game.ask))
onMounted(() => setTimeout(instruct, 350))

/** Light a group's things one by one while counting it out loud. */
async function countGroup(g: MatchGroup) {
  counting.value = { n: g.n, k: 0 }
  const finished = await countAloud(1, g.n, (k) => { counting.value = { n: g.n, k } }, g.n > 10 ? 320 : 480)
  if (finished) setTimeout(() => { if (counting.value?.n === g.n) counting.value = null }, 600)
  return finished
}

async function check(number: number, groupN: number) {
  selected.value = null
  if (number !== groupN) {
    wobble.value = { n: groupN, t: (wobble.value?.t ?? 0) + 1 }
    effect('tryAgain')
    say(sayThats(groupN))
    if (++wrong >= 2) hintFor.value = number
    return
  }
  matched.value.push(number)
  hintFor.value = null
  wrong = 0
  effect('success')
  const g = groups.find(x => x.n === number)!
  if (!(await countGroup(g))) return
  if (matched.value.length === groups.length && !done.value) {
    done.value = true
    await beat(200)
    effect('celebrate')
    emit('solved')
    await then([sayPhrase(props.game.cheer)])
  }
}

function tapNumber(n: number) {
  if (done.value || matched.value.includes(n)) return
  if (selected.value?.kind === 'group') return check(n, selected.value.n)
  effect('tap')
  say(sayNumber(n))
  selected.value = selected.value?.n === n && selected.value.kind === 'number' ? null : { kind: 'number', n }
}

function tapGroup(g: MatchGroup) {
  if (done.value || matched.value.includes(g.n)) return
  if (selected.value?.kind === 'number') return check(selected.value.n, g.n)
  effect('tap')
  selected.value = { kind: 'group', n: g.n }
  countGroup(g)
}

const drag = useDragDrop<number>({
  onTap: tapNumber,
  onDrop: (n, target) => {
    if (target?.startsWith('group-')) check(n, Number(target.slice(6)))
  },
})

const litIn = (g: MatchGroup) => (counting.value?.n === g.n ? counting.value.k : matched.value.includes(g.n) ? g.n : 0)
const CARS = ['#FF6B6B', '#4DABF7', '#FFD43B', '#69DB7C']
const carTint = (n: number) => CARS[numbers.indexOf(n) % CARS.length]
</script>

<template>
  <div class="flex size-full flex-col gap-3 landscape:flex-row">
    <!-- Numbers (or cars) -->
    <section class="flex flex-col items-center justify-center gap-2 landscape:w-[32%]">
      <button type="button" class="toy-press flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 font-black text-ink" data-prompt @click="instruct">
        <AppIcon name="speaker" class="size-6 text-ink-soft" />
        <span class="text-lg">{{ isParking ? 'Park the cars' : 'Match them' }}</span>
      </button>
      <div class="flex flex-wrap items-center justify-center gap-3 landscape:flex-col landscape:flex-nowrap">
        <button
          v-for="n in numbers"
          :key="n"
          type="button"
          class="relative grid touch-none place-items-center transition-all"
          :class="[
            isParking ? 'h-[clamp(4.5rem,18vw,5.5rem)] w-[clamp(6rem,24vw,7.5rem)]' : 'toy-press size-[4.5rem] rounded-2xl bg-white sm:size-20',
            matched.includes(n) ? 'invisible' : '',
            selected?.kind === 'number' && selected.n === n ? '-translate-y-1 scale-110 ring-4 ring-sunny rounded-2xl' : '',
            drag.ghost.item === n ? 'opacity-30' : '',
          ]"
          :aria-label="isParking ? `Car number ${n}` : `Number ${n}`"
          :data-number="n"
          @pointerdown="drag.start($event, n)"
          @click="drag.keyboard($event, n)"
        >
          <NumberArt v-if="isParking" kind="car" :tint="carTint(n)" class="absolute inset-0 size-full" />
          <span class="relative font-black leading-none text-ink" :class="isParking ? '-mt-[12%] rounded-lg bg-white/90 px-1.5 text-3xl' : 'text-5xl'">{{ n }}</span>
        </button>
      </div>
    </section>

    <!-- Groups (or parking spaces) -->
    <section class="grid min-h-0 flex-1 grid-cols-2 content-center gap-3">
      <button
        v-for="g in groups"
        :key="`${g.n}-${wobble?.n === g.n ? wobble.t : 0}`"
        type="button"
        class="relative flex min-h-32 flex-col items-center justify-center gap-1 rounded-[1.75rem] p-2 transition-all"
        :class="[
          isParking ? 'border-4 border-dashed border-white bg-[#6C6F7F]' : 'bg-white/85 shadow-sm',
          matched.includes(g.n) ? (isParking ? 'border-solid border-mint' : 'ring-4 ring-mint') : '',
          selected?.kind === 'group' && selected.n === g.n ? 'ring-4 ring-sunny' : '',
          drag.ghost.over === `group-${g.n}` ? 'scale-105 ring-4 ring-sunny' : '',
          wobble?.n === g.n ? 'animate-wiggle' : '',
          hintFor === g.n ? 'animate-glow' : '',
        ]"
        :data-drop="matched.includes(g.n) ? undefined : `group-${g.n}`"
        :data-group="g.n"
        :aria-label="matched.includes(g.n) ? `${g.n}, matched` : 'A group to count'"
        @click="tapGroup(g)"
      >
        <CountGroup v-if="g.show === 'things' && !isParking" :n="g.n" :kind="thing" :size="g.n > 5 ? 30 : 42" :lit="litIn(g)" />
        <QuantityDots v-else :n="g.n" :a="g.show === 'sum' ? g.a : 0" :lit="litIn(g) || -1" :size="g.n > 10 ? 11 : 15" />
        <span v-if="matched.includes(g.n)" class="flex animate-pop items-center gap-1">
          <NumberArt v-if="isParking" kind="car" :tint="carTint(g.n)" class="h-10 w-14" />
          <span class="grid min-w-10 place-items-center rounded-xl bg-mint px-2 text-2xl font-black text-mint-ink">{{ g.n }}</span>
        </span>
      </button>
    </section>

    <div v-if="drag.ghost.item !== null" class="pointer-events-none fixed z-50 grid scale-110 place-items-center" :class="!isParking && 'rounded-2xl bg-white shadow-xl'" :style="drag.ghostStyle.value">
      <NumberArt v-if="isParking" kind="car" :tint="carTint(drag.ghost.item)" class="absolute inset-0 size-full" />
      <span class="relative text-4xl font-black text-ink" :class="isParking && 'rounded-lg bg-white/90 px-1.5'">{{ drag.ghost.item }}</span>
    </div>
  </div>
</template>
