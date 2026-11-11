<script setup lang="ts">
import type { Difficulty } from '~/games/numbers/rounds'
import { findRound } from '~/games/numbers/rounds'
import type { NumberArtKind, NumberGame } from '~/data/number-games'
import { sayNumber, sayPhrase } from '~/data/english-numbers'

/**
 * Find the number: pop the balloon, catch the fish or fly to the planet with the right number.
 * The question changes with the level: find 4 (shown as 4 and as 4 dots), count a group and find
 * its number, which has more or less, what's missing in 7 8 _ 10, and in Super Challenge adding
 * and taking away, shown with dots first.
 *
 * A wrong pick wiggles and says its own number; two wrong picks and the right one glows.
 */
const props = defineProps<{ game: NumberGame, difficulty: Difficulty, step: number, index: number }>()
const emit = defineEmits<{ solved: [] }>()
const { say, effect } = useAudio()
const { countAloud, then, beat } = useCounting()
const DEV = import.meta.dev

const round = findRound(props.difficulty, props.step, props.index)
const p = round.prompt
const compare = p.kind === 'more' || p.kind === 'less'
const COUNT_THINGS: Record<string, NumberArtKind> = { balloons: 'gift', fishing: 'shell', space: 'star' }
const thing = COUNT_THINGS[props.game.id] ?? 'star'

const picked = ref<number | null>(null)
const wobble = ref<{ value: number, n: number } | null>(null)
const hint = ref(false)
const lit = ref(-1)
const done = ref(false)
let wrong = 0

// ---- what to say ---------------------------------------------------------------------------------

function instruction() {
  switch (p.kind) {
    case 'find': return [sayPhrase(props.game.ask), sayNumber(p.n)]
    case 'howMany': return [sayPhrase('howMany')]
    case 'more': return [sayPhrase('whichMore')]
    case 'less': return [sayPhrase('whichLess')]
    case 'add': return [sayNumber(p.a), sayPhrase('and'), sayNumber(p.b), sayPhrase('howMany')]
    case 'sub': return [sayNumber(p.a), sayPhrase('takeAway'), sayNumber(p.b), sayPhrase('howMany')]
    case 'missing': return [sayPhrase('whichIsMissing')]
  }
}
const instruct = () => say(instruction())
onMounted(() => setTimeout(instruct, 350))

// ---- playing ---------------------------------------------------------------------------------------

const box = ref<HTMLElement | null>(null)
const rocket = ref<{ x: number, y: number } | null>(null)

async function choose(value: number, el: HTMLElement) {
  if (done.value) return
  if (value !== round.answer) {
    wobble.value = { value, n: (wobble.value?.n ?? 0) + 1 }
    effect('tryAgain')
    say(compare ? [sayPhrase(p.kind === 'more' ? 'thatsLess' : 'thatsMore')] : [sayPhrase('thats'), sayNumber(value)])
    if (++wrong >= 2) hint.value = true
    return
  }
  done.value = true
  picked.value = value
  hint.value = false
  if (props.game.id === 'space' && box.value) {
    const a = box.value.getBoundingClientRect()
    const b = el.getBoundingClientRect()
    rocket.value = { x: b.left - a.left + b.width / 2, y: b.top - a.top }
  }
  effect(props.game.id === 'balloons' ? 'pop' : props.game.id === 'space' ? 'whoosh' : 'success')
  await beat(props.game.id === 'space' ? 900 : 500)
  // Count the amount out loud, so the number and its quantity go together.
  const counted = p.kind === 'howMany' ? p.n : p.kind === 'add' ? p.a + p.b : p.kind === 'sub' ? p.a - p.b : 0
  if (counted && !(await countAloud(1, counted, (k) => { lit.value = k }))) return
  effect('success')
  emit('solved')
  await then([sayNumber(round.answer), sayPhrase(props.game.cheer)])
}

// ---- looks ---------------------------------------------------------------------------------------

const TINTS = ['#FF8FA3', '#74C0FC', '#FFD43B', '#8CE99A', '#B197FC', '#FFA94D']
const tint = (i: number) => TINTS[(i + props.index) % TINTS.length]
const label = computed(() => {
  switch (p.kind) {
    case 'find': return `Find ${p.n}`
    case 'howMany': return 'How many?'
    case 'more': return 'Which has more?'
    case 'less': return 'Which has less?'
    case 'add': return `${p.a} + ${p.b}`
    case 'sub': return `${p.a} − ${p.b}`
    case 'missing': return p.run.map(n => n ?? '?').join(' ')
  }
})
const big = 'text-[clamp(2.6rem,11vw,4rem)] font-black leading-none text-ink landscape:text-[clamp(2.2rem,9vh,3.6rem)]'
</script>

<template>
  <div class="flex size-full flex-col gap-3 landscape:flex-row">
    <!-- The question -->
    <section class="flex flex-col items-center justify-center landscape:w-[44%]">
      <div class="relative flex max-w-full flex-col items-center gap-2 rounded-[1.75rem] bg-white/90 px-4 pb-3 pt-1 shadow-sm" data-prompt>
        <button
          type="button"
          class="flex min-h-12 items-center gap-1 rounded-full px-3 text-xs font-black uppercase tracking-[0.18em] text-ink-soft"
          :aria-label="`${label}. Tap to hear again.`"
          @click="instruct"
        >
          <AppIcon name="speaker" class="size-6" />
          {{ p.kind === 'find' ? 'Find' : p.kind === 'missing' ? 'What\'s missing?' : compare ? (p.kind === 'more' ? 'More' : 'Less') : 'How many?' }}
        </button>

        <span v-if="p.kind === 'find'" class="flex items-center gap-3">
          <span :class="big">{{ p.n }}</span>
          <QuantityDots :n="p.n" :size="p.n > 10 ? 12 : 16" />
        </span>

        <span v-else-if="p.kind === 'howMany'" class="flex items-center gap-3">
          <CountGroup :n="p.n" :kind="thing" :size="p.n > 10 ? 30 : 44" countable :lit="Math.max(0, lit)" :tens="p.tens" />
          <span :class="big">{{ done ? p.n : '?' }}</span>
        </span>

        <span v-else-if="compare" class="flex items-end gap-2" aria-hidden="true">
          <span class="flex flex-col items-center gap-0.5">
            <span v-for="k in (p.kind === 'more' ? 4 : 1)" :key="k" class="h-3 w-10 rounded-full bg-coral" />
          </span>
          <span :class="big">{{ p.kind === 'more' ? 'More?' : 'Less?' }}</span>
        </span>

        <span v-else-if="p.kind === 'add' || p.kind === 'sub'" class="flex flex-wrap items-center justify-center gap-2">
          <span class="flex flex-col items-center gap-1">
            <QuantityDots :n="p.kind === 'add' ? p.a + p.b : p.a" :a="p.kind === 'add' ? p.a : 0" :crossed="p.kind === 'sub' ? p.b : 0" :lit="lit" :size="14" />
          </span>
          <span :class="big">{{ label }} = <span :class="done ? 'text-mint-ink' : 'text-ink-soft'">{{ done ? round.answer : '?' }}</span></span>
        </span>

        <span v-else-if="p.kind === 'missing'" class="flex flex-wrap items-center justify-center gap-1.5">
          <span
            v-for="(n, i) in p.run"
            :key="i"
            class="grid min-w-14 place-items-center rounded-2xl px-2 py-1 text-[clamp(1.8rem,8vw,2.6rem)] font-black"
            :class="n === null ? (done ? 'bg-mint text-mint-ink' : 'animate-glow bg-sunny text-ink') : 'bg-cream text-ink'"
          >{{ n ?? (done ? round.answer : '?') }}</span>
        </span>
      </div>
    </section>

    <!-- The choices -->
    <section ref="box" class="relative flex min-h-0 flex-1 flex-wrap content-center items-center justify-center gap-x-4 gap-y-3 rounded-[2rem] p-3" :class="game.id === 'fishing' ? 'bg-sky-ink/10' : ''">
      <button
        v-for="(value, i) in round.choices"
        :key="`${value}-${wobble?.value === value ? wobble.n : 0}`"
        type="button"
        class="choice relative grid shrink-0 place-items-center"
        :class="[
          game.id === 'balloons' ? 'h-[clamp(8.5rem,34vw,11rem)] w-[clamp(7rem,28vw,9rem)]' : game.id === 'fishing' ? 'h-[clamp(5.5rem,22vw,7rem)] w-[clamp(7.5rem,32vw,10rem)]' : 'size-[clamp(7rem,30vw,9rem)]',
          picked === value ? `picked-${game.id}` : done ? 'opacity-40' : game.id === 'fishing' ? 'swim' : 'animate-float',
          wobble?.value === value && 'animate-wiggle',
          hint && value === round.answer && 'animate-glow rounded-full',
        ]"
        :style="{ animationDelay: `${-i * 0.8}s` }"
        :aria-label="compare ? `A group of ${value}` : `Number ${value}`"
        :data-value="value"
        :data-correct="DEV && value === round.answer ? '' : undefined"
        @click="choose(value, $event.currentTarget as HTMLElement)"
      >
        <NumberArt :kind="game.id === 'balloons' ? 'balloon' : game.id === 'fishing' ? 'fish' : 'planet'" :tint="tint(i)" :flip="game.id === 'fishing' && i % 2 === 1" class="absolute inset-0 size-full drop-shadow-md" />
        <span
          class="relative grid place-items-center"
          :class="game.id === 'balloons' ? '-mt-[18%]' : game.id === 'fishing' ? (i % 2 ? 'ml-[8%]' : '-ml-[8%]') : ''"
        >
          <QuantityDots v-if="compare" :n="value" :size="value > 5 ? 10 : 13" />
          <span v-else class="rounded-2xl bg-white/80 px-2 text-[clamp(2.2rem,9vw,3.2rem)] font-black leading-tight text-ink">{{ value }}</span>
        </span>
      </button>

      <!-- Space: the rocket waits at the bottom, then flies to the planet -->
      <div
        v-if="game.id === 'space'"
        class="pointer-events-none absolute size-20 transition-all duration-700 ease-in-out motion-reduce:transition-none"
        :style="rocket ? { left: `${rocket.x - 40}px`, top: `${rocket.y - 60}px` } : { left: '0.5rem', bottom: '0.5rem' }"
        aria-hidden="true"
      >
        <NumberArt kind="rocket" class="size-full" :class="rocket ? 'rotate-0' : 'rotate-45'" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.swim {
  animation: swim 3.6s ease-in-out infinite alternate;
}
@keyframes swim {
  from { transform: translateX(-6%) translateY(2%); }
  to { transform: translateX(6%) translateY(-2%); }
}
.picked-balloons {
  animation: pop-away 0.5s ease-out forwards;
}
@keyframes pop-away {
  40% { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}
.picked-fishing {
  animation: hooked 0.9s ease-in-out forwards;
}
@keyframes hooked {
  30% { transform: translateY(6%) rotate(-10deg); }
  100% { transform: translateY(-40%) rotate(-25deg) scale(1.1); }
}
.picked-space {
  animation: landed 1.2s ease-out forwards;
  animation-delay: 0.6s;
}
@keyframes landed {
  50% { transform: scale(1.15); }
  100% { transform: scale(1.05); filter: drop-shadow(0 0 12px #ffe066); }
}
@media (prefers-reduced-motion: reduce) {
  .swim, .picked-balloons, .picked-fishing, .picked-space { animation: none; }
  .picked-balloons { opacity: 0.3; }
}
</style>
