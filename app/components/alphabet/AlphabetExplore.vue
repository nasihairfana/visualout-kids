<script setup lang="ts">
import type { AlphabetLetter } from '~/types/learning'

/**
 * Mode 1 — Explore Alphabets.
 * One letter at a time: tap the letter to hear it, tap the object to hear the word,
 * big previous / next arrows (or swipe), optional A–Z sheet for grown-ups.
 */
const route = useRoute()
const router = useRouter()
const { letters, byId, indexOf, clips, pack } = useAlphabetGame()
const { say, effect, stop } = useAudio()
const { settings } = useSoundSettings()
const { markExplored, lastLetter } = useGameProgress()

const initial = byId(route.query.letter as string) ?? byId(lastLetter.value) ?? letters[0]!
const current = ref<AlphabetLetter>(initial)
const index = computed(() => indexOf(current.value))
const theme = computed(() => themeOf(current.value.theme))
const showGrid = ref(false)
const finished = ref(false)
const objectBounce = ref(false)

watch(current, (l) => {
  markExplored(l.id)
  router.replace({ query: { letter: l.id } })
}, { immediate: true })

function goTo(letter: AlphabetLetter, speak = settings.value.autoInstructions) {
  current.value = letter
  effect('page')
  if (speak) say([clips.letter(letter), clips.word(letter)])
  else stop()
}

function next() {
  if (index.value >= letters.length - 1) {
    stop()
    finished.value = true
    return
  }
  goTo(letters[index.value + 1]!)
}

function prev() {
  if (index.value > 0) goTo(letters[index.value - 1]!)
}

async function tapObject() {
  objectBounce.value = false
  requestAnimationFrame(() => { objectBounce.value = true })
  effect('tap')
  const l = current.value
  const sound = clips.objectSound(l)
  await say(sound ? [clips.word(l), sound] : clips.word(l))
}

function pickFromGrid(letter: AlphabetLetter) {
  showGrid.value = false
  goTo(letter)
}

function replay() {
  finished.value = false
  current.value = letters[0]!
}

// Swipe left / right to move between letters.
let startX: number | null = null
let swiped = false
function onPointerDown(e: PointerEvent) {
  startX = e.clientX
  swiped = false
}
function onPointerUp(e: PointerEvent) {
  if (startX === null) return
  const dx = e.clientX - startX
  startX = null
  if (Math.abs(dx) < 70) return
  swiped = true
  if (dx < 0) next()
  else prev()
}
// A swipe that started on the letter or object shouldn't also count as a tap on it.
function onClickCapture(e: MouseEvent) {
  if (swiped) {
    e.stopPropagation()
    swiped = false
  }
}

onBeforeUnmount(stop)
const gameHome = useGameHome()
</script>

<template>
  <div class="safe-screen flex flex-col gap-3 transition-colors duration-500" :class="theme.soft">
    <GameTopBar>
      <button type="button" class="toy-press grid size-16 place-items-center rounded-full bg-white" aria-label="Show all letters" @click="showGrid = true">
        <AppIcon name="grid" class="size-8" />
      </button>
    </GameTopBar>

    <main
      class="flex min-h-0 flex-1 touch-none flex-col items-center justify-center gap-[3vh] landscape:flex-row landscape:gap-[6vw]"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="startX = null"
      @click.capture="onClickCapture"
    >
      <Transition mode="out-in" enter-from-class="opacity-0 scale-90" enter-active-class="transition duration-300" leave-to-class="opacity-0 scale-95" leave-active-class="transition duration-150">
        <AlphabetCard :key="current.id" :letter="current" />
      </Transition>

      <div class="flex flex-col items-center gap-2">
        <button
          type="button"
          class="rounded-full p-2"
          :aria-label="`${current.word}. Tap to hear it.`"
          @click="tapObject"
        >
          <Transition mode="out-in" enter-from-class="opacity-0 translate-y-4" enter-active-class="transition duration-300" leave-to-class="opacity-0" leave-active-class="transition duration-150">
            <div :key="current.id" :class="objectBounce ? 'animate-bounce-soft' : 'animate-float'" @animationend="objectBounce = false">
              <ObjectIllustration :letter="current" />
            </div>
          </Transition>
        </button>
        <p class="text-[min(11vw,7vh)] font-black leading-none tracking-wide" :class="theme.ink">
          <span class="underline decoration-sunny decoration-[0.12em] underline-offset-[0.15em]">{{ current.word.charAt(0) }}</span>{{ current.word.slice(1) }}
        </p>
      </div>
    </main>

    <nav class="flex items-center justify-center gap-3 sm:gap-6" aria-label="Letter controls">
      <button
        type="button"
        class="toy-press grid size-20 place-items-center rounded-full bg-white text-ink transition-opacity sm:size-24"
        :class="index === 0 && 'pointer-events-none opacity-40'"
        :disabled="index === 0"
        aria-label="Previous letter"
        @click="prev"
      >
        <AppIcon name="prev" class="size-10 sm:size-12" />
      </button>

      <AudioButton :clip="clips.letter(current)" :label="`Hear the letter ${current.uppercase}`" size="md" :tone="`${theme.bg} ${theme.ink}`" class="relative">
        <span class="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-white text-lg font-black shadow" aria-hidden="true">{{ current.uppercase }}</span>
      </AudioButton>
      <AudioButton :clip="clips.word(current)" :label="`Hear the word ${current.word}`" size="md" :tone="`${theme.bg} ${theme.ink}`" class="relative">
        <span class="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-white shadow" aria-hidden="true"><ObjectIllustration :letter="current" size="xs" /></span>
      </AudioButton>

      <button
        type="button"
        class="toy-press grid size-20 place-items-center rounded-full bg-sunny text-ink sm:size-24"
        aria-label="Next letter"
        @click="next"
      >
        <AppIcon name="next" class="size-10 animate-nudge sm:size-12" />
      </button>
    </nav>

    <AlphabetNavigation :open="showGrid" :current-id="current.id" @select="pickFromGrid" @close="showGrid = false" />

    <GameFeedback
      v-if="finished"
      message="Great exploring!"
      :clip="clips.phrase(pack.phrases.greatExploring)"
      @replay="replay"
      @home="navigateTo(gameHome)"
    />
  </div>
</template>
