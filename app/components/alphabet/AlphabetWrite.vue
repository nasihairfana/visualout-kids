<script setup lang="ts">
import type { AlphabetLetter } from '~/types/learning'

/**
 * Mode 4 — Write. Trace a dotted capital letter with a finger; when it's done, the letter pops
 * in solid colour and the voice cheers. Eraser wipes it to trace again, "Show me" replays how.
 * Starts at the first letter not yet written, so a child carries on where they left off.
 */
const route = useRoute()
const router = useRouter()
const { letters, byId, indexOf, clips, pack } = useAlphabetGame()
const { say, effect, stop } = useAudio()
const { settings } = useSoundSettings()
const { writtenSet, markWritten } = useGameProgress()
const gameHome = useGameHome()

const firstUnwritten = letters.find(l => !writtenSet.value.has(l.id))
const current = ref<AlphabetLetter>(byId(route.query.letter as string) ?? firstUnwritten ?? letters[0]!)
const index = computed(() => indexOf(current.value))
const theme = computed(() => themeOf(current.value.theme))
const tracer = ref<{ clear: () => void, showMe: () => void } | null>(null)
const done = ref(false)
const showGrid = ref(false)
const finished = ref(false)

function introduce() {
  done.value = false
  if (settings.value.autoInstructions) say(clips.phrase(pack.phrases.letsWrite(current.value)))
}

watch(current, (l) => {
  router.replace({ query: { letter: l.id } })
  introduce()
}, { immediate: true })

function goTo(letter: AlphabetLetter) {
  effect('page')
  stop()
  current.value = letter
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

function onStroke() {
  effect('stroke')
}

function onComplete() {
  done.value = true
  markWritten(current.value.id)
  effect('celebrate')
  say([clips.phrase(pack.phrases.youWrote(current.value)), clips.phrase(pack.phrases.letterIsFor(current.value))])
}

function erase() {
  effect('page')
  stop()
  done.value = false
  tracer.value?.clear()
}

function showMe() {
  effect('tap')
  if (done.value) erase()
  tracer.value?.showMe()
  say(clips.letter(current.value))
}

function pickFromGrid(letter: AlphabetLetter) {
  showGrid.value = false
  goTo(letter)
}

function replay() {
  finished.value = false
  current.value = letters[0]!
}

onBeforeUnmount(stop)
</script>

<template>
  <div class="safe-screen flex flex-col gap-3 transition-colors duration-500" :class="theme.soft">
    <GameTopBar>
      <button type="button" class="toy-press grid size-16 place-items-center rounded-full bg-white" aria-label="Show all letters" @click="showGrid = true">
        <AppIcon name="grid" class="size-8" />
      </button>
    </GameTopBar>

    <!-- Portrait: letter above a row of buttons. Landscape: letter beside a 2×2 block of buttons. -->
    <div class="flex min-h-0 flex-1 flex-col gap-3 landscape:flex-row landscape:items-center landscape:justify-center landscape:gap-[5vw]">
      <main class="flex min-h-0 flex-1 items-center justify-center landscape:h-full landscape:flex-none">
        <!-- Tracing card -->
        <div class="relative aspect-[100/120] h-full max-h-[min(100%,calc(86vw*1.2))] rounded-blob bg-white/80 p-[3%] shadow-sm">
          <LetterTracer :key="current.id" ref="tracer" :letter="current" @stroke="onStroke" @complete="onComplete" />

          <!-- Finished: stars and the picture pop in -->
          <template v-if="done">
            <AppIcon name="star" class="absolute -left-3 top-6 size-10 animate-pop text-sunny drop-shadow [animation-delay:150ms] [animation-fill-mode:both]" />
            <AppIcon name="star" class="absolute -right-2 top-1/3 size-12 animate-pop text-sunny drop-shadow [animation-delay:300ms] [animation-fill-mode:both]" />
            <AppIcon name="star" class="absolute bottom-10 left-2 size-8 animate-pop text-sunny drop-shadow [animation-delay:450ms] [animation-fill-mode:both]" />
            <div class="absolute -bottom-4 -right-4 grid size-24 animate-pop place-items-center rounded-full bg-white shadow-md [animation-delay:500ms] [animation-fill-mode:both] sm:size-28">
              <ObjectIllustration :letter="current" size="sm" />
            </div>
          </template>
        </div>
      </main>

      <nav class="flex items-center justify-center gap-3 sm:gap-6 landscape:grid landscape:grid-cols-2 landscape:gap-4" aria-label="Writing controls">
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

        <button type="button" class="toy-press grid size-20 place-items-center rounded-full bg-white text-ink landscape:order-first" aria-label="Rub out and try again" @click="erase">
          <AppIcon name="eraser" class="size-10" />
        </button>
        <button type="button" class="toy-press grid size-20 place-items-center rounded-full bg-white landscape:order-first" :class="theme.ink" aria-label="Show me how" @click="showMe">
          <AppIcon name="hand" class="size-10" />
        </button>

        <button
          type="button"
          class="toy-press grid size-20 place-items-center rounded-full text-ink transition-transform sm:size-24"
          :class="done ? 'scale-110 bg-sunny' : 'bg-white'"
          aria-label="Next letter"
          @click="next"
        >
          <AppIcon name="next" class="size-10 sm:size-12" :class="done && 'animate-nudge'" />
        </button>
      </nav>
    </div>

    <AlphabetNavigation :open="showGrid" :current-id="current.id" :done-ids="writtenSet" @select="pickFromGrid" @close="showGrid = false" />

    <GameFeedback
      v-if="finished"
      message="Great writing!"
      :clip="clips.phrase(pack.phrases.greatWriting)"
      @replay="replay"
      @home="navigateTo(gameHome)"
    />
  </div>
</template>
