<script setup lang="ts">
import type { SpokenClip } from '~/types/learning'
import type { Cell, Difficulty } from '~/games/trail/levels'
import { buildLevel } from '~/games/trail/levels'
import type { TrailTheme } from '~/data/trail-themes'
import { themeById } from '~/data/trail-themes'

/**
 * Letter Trails: see the letter, follow it across the map, get the animal to its goal.
 *
 * Gentle rules (same spirit as the rest of My First ABC): no timer, nothing lost. A wrong letter
 * wobbles and says its name; the animal just doesn't move. The right letter further along the
 * trail lights up the next step instead. Two wrong tries in a row, or a long pause, and the next
 * step glows. Every finished level earns its stars.
 */
const props = defineProps<{ difficulty: Difficulty, themeId: string }>()

const { letters, clips, pack } = useAlphabetGame()
const { say, effect, stop } = useAudio()
const progress = useTrailProgress()
const theme = computed<TrailTheme>(() => themeById(props.themeId))

const levelNumber = ref(progress.levelOf(props.difficulty))
const level = computed(() => buildLevel(letters, props.difficulty, levelNumber.value, levelNumber.value - 1))
const position = ref(0)
const hint = ref<Cell | null>(null)
const wobble = ref<{ cell: Cell, n: number } | null>(null)
const done = ref(false)
const showSuccess = ref(false)
const unlocked = ref<TrailTheme[]>([])
let wrongInARow = 0
let idleTimer: ReturnType<typeof setTimeout> | undefined
let successTimer: ReturnType<typeof setTimeout> | undefined

const last = computed(() => level.value.path.length - 1)

// ---- what to say ---------------------------------------------------------------------------------

function instruction(): SpokenClip[] {
  const L = level.value
  const first = L.sequence[0]!
  if (L.mode === 'letter') return [clips.phrase(pack.phrases.followTheLetter(first))]
  if (L.mode === 'mixed') return [clips.phrase(pack.phrases.bigAndLittle(first))]
  if (L.mode === 'sequence') return [clips.phrase(pack.phrases.followTheLetters), ...L.sequence.map(clips.letter)]
  return [clips.phrase(pack.phrases.letsSpell), ...L.sequence.map(clips.letter), clips.word(L.word!)]
}
const instruct = () => say(instruction())

// ---- playing ------------------------------------------------------------------------------------

const same = (a: Cell, b: Cell) => a.r === b.r && a.c === b.c

function restartIdle() {
  clearTimeout(idleTimer)
  if (done.value) return
  idleTimer = setTimeout(() => { hint.value = level.value.path[position.value + 1] ?? null }, 7000)
}

function select(cell: Cell) {
  if (done.value) return
  const L = level.value
  const next = L.path[position.value + 1]!
  if (same(cell, next)) {
    position.value++
    hint.value = null
    wrongInARow = 0
    if (position.value === last.value) return finish()
    const tile = L.tiles.find(t => same(t, cell))!
    effect('stroke')
    say(clips.letter(letters.find(l => l.id === tile.letterId)!))
    restartIdle()
    return
  }
  const tile = L.tiles.find(t => same(t, cell))
  if (!tile || (tile.step !== null && tile.step <= position.value)) return
  if (tile.step !== null) {
    // The right letter, just further along: show where the next step is. Not a mistake.
    hint.value = next
    effect('tap')
    return
  }
  // A different letter: it wobbles and says its name. The animal stays put.
  wobble.value = { cell, n: (wobble.value?.n ?? 0) + 1 }
  wrongInARow++
  effect('tryAgain')
  say([clips.phrase(pack.phrases.thatIs(letters.find(l => l.id === tile.letterId)!))])
  if (wrongInARow >= 2) hint.value = next
  restartIdle()
}

function finish() {
  done.value = true
  clearTimeout(idleTimer)
  effect('celebrate')
  say([clips.phrase(pack.phrases.foundTheWay), { src: null, text: theme.value.arrival }])
  unlocked.value = progress.complete(props.difficulty, levelNumber.value)
  successTimer = setTimeout(() => { showSuccess.value = true }, 1500)
}

function startLevel(n: number) {
  stop()
  clearTimeout(successTimer)
  levelNumber.value = n
  position.value = 0
  hint.value = null
  wobble.value = null
  done.value = false
  showSuccess.value = false
  unlocked.value = []
  wrongInARow = 0
  setTimeout(instruct, 400)
  restartIdle()
}

onMounted(() => startLevel(levelNumber.value))
onBeforeUnmount(() => {
  clearTimeout(idleTimer)
  clearTimeout(successTimer)
  stop()
})

const steps = computed(() => last.value)
</script>

<template>
  <div class="safe-screen relative flex flex-col gap-2 overflow-hidden landscape:flex-row landscape:gap-4">
    <TrailScenery :theme="theme" />

    <!-- Controls and the letter to follow: across the top on a tall screen, down the side on a wide one -->
    <aside class="relative z-10 flex flex-col gap-2 landscape:order-last landscape:w-[min(30vw,15rem)] landscape:shrink-0 landscape:justify-between landscape:py-1">
      <GameTopBar home="/abc/trail">
        <span class="rounded-full bg-white/90 px-4 py-2 text-lg font-black text-ink shadow-sm landscape:hidden">Level {{ levelNumber }}</span>
      </GameTopBar>

      <section class="flex items-center justify-center gap-3 landscape:flex-col" aria-live="polite">
        <button
          type="button"
          class="toy-press flex items-center gap-3 rounded-[1.75rem] border-4 bg-butter px-4 py-2 landscape:flex-col landscape:px-3 landscape:py-3"
          :style="{ borderColor: theme.colors.accent }"
          :aria-label="`Follow ${level.sequence.map(l => l.uppercase).join(', ')}. Tap to hear again.`"
          @click="instruct"
        >
          <span class="flex items-center gap-1 text-xs font-black uppercase tracking-[0.18em] text-butter-ink">
            <AppIcon name="speaker" class="size-5" />
            <template v-if="level.mode === 'word'">Spell</template>
            <template v-else>Follow</template>
          </span>

          <!-- One letter (or big and little) -->
          <span v-if="level.mode === 'letter' || level.mode === 'mixed'" class="flex items-baseline gap-2 font-black leading-none text-ink">
            <span class="text-[clamp(3rem,13vw,4.5rem)] landscape:text-[clamp(3rem,11vh,5rem)]">{{ level.mode === 'letter' && level.letterCase === 'lower' ? level.sequence[0]!.lowercase : level.sequence[0]!.uppercase }}</span>
            <span v-if="level.mode === 'mixed'" class="text-[clamp(2.4rem,10vw,3.6rem)] landscape:text-[clamp(2.4rem,9vh,4rem)]">{{ level.sequence[0]!.lowercase }}</span>
          </span>

          <!-- A sequence or a word: the next letter is the big one -->
          <span v-else class="flex flex-wrap items-center justify-center gap-1.5">
            <ObjectIllustration v-if="level.word" :letter="level.word" size="xs" class="!size-12 !text-4xl" />
            <span
              v-for="(l, i) in level.sequence"
              :key="i"
              class="grid min-w-10 place-items-center rounded-xl px-1 font-black leading-none transition-all duration-200"
              :class="!done && i === position % level.sequence.length ? 'scale-110 bg-white py-1.5 text-4xl text-ink shadow' : 'py-1 text-2xl text-ink/45'"
            >{{ l.uppercase }}</span>
          </span>
        </button>
      </section>

      <div class="flex flex-col items-center gap-1">
        <span class="hidden rounded-full bg-white/90 px-4 py-1.5 text-lg font-black text-ink shadow-sm landscape:block">Level {{ levelNumber }}</span>
        <div class="rounded-full bg-white/70 px-3 py-1.5">
          <RoundProgress :current="Math.min(position + 1, steps)" :total="steps" />
        </div>
      </div>
    </aside>

    <main class="relative z-10 min-h-0 flex-1">
      <TrailBoard
        :level="level"
        :theme="theme"
        :position="position"
        :hint="hint"
        :wobble="wobble"
        :done="done"
        @select="select"
        @hero="instruct"
      />
    </main>

    <TrailSuccess
      v-if="showSuccess"
      :theme="theme"
      :level="levelNumber"
      :unlocked="unlocked"
      @next="startLevel(levelNumber + 1)"
      @replay="startLevel(levelNumber)"
      @home="navigateTo('/abc/trail')"
    />
  </div>
</template>
