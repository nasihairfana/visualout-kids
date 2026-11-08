<script setup lang="ts">
import type { Insets } from '~/games/webbo/world'

/**
 * Webbo's Letter City. "Catch the letter B!": tap the right balloon and Webbo webs it in.
 * The rules are Find the letter's (`useChoiceActivity`): wait-then-look, calm pause for quick
 * guesses, hint after two misses, adaptive difficulty. Only the scene is new.
 */
const { clips, pack } = useAlphabetGame()
const game = useChoiceActivity({
  mode: 'web',
  rounds: 5,
  adaptive: true,
  instruction: t => [clips.phrase(pack.phrases.catchTheLetter(t))],
  onCorrect: t => [clips.phrase(pack.phrases.letterIsFor(t))],
  onIncorrect: picked => [clips.phrase(pack.phrases.thatIs(picked))],
})
const { round, roundNumber, total, finished, solved, showHint, wiggling, waiting, calming, nudges, celebration } = game
const gameHome = useGameHome()

const { say } = useAudio()
const flat = ref(false)

// After the fifth balloon the scene plays its finale first; then the "Great swinging!" screen.
const showFeedback = ref(false)
watch(finished, (done) => { if (!done) showFeedback.value = false })

// "Show me the move" button: Webbo wiggles and points, and the voice says how.
const moves = ref(0)
function showMove() {
  moves.value++
  say(clips.phrase(pack.phrases.wiggleAndPoint))
}

function pick(id: string) {
  const letter = round.value.choices.find(c => c.id === id)
  if (letter) game.pick(letter)
}

// Tapping while the question is still being asked bounces the letter to catch.
const sampleBounce = ref(false)
watch(nudges, () => {
  sampleBounce.value = false
  requestAnimationFrame(() => { sampleBounce.value = true })
})

// Tell the 3D scene which parts of the screen the controls cover, so balloons stay clear of them.
const root = ref<HTMLElement | null>(null)
const topBar = ref<HTMLElement | null>(null)
const targetRow = ref<HTMLElement | null>(null)
const insets = ref<Insets>({ top: 0, right: 0, bottom: 0, left: 0 })

function measure() {
  if (!root.value || !topBar.value || !targetRow.value) return
  const box = root.value.getBoundingClientRect()
  const bar = topBar.value.getBoundingClientRect()
  const row = targetRow.value.getBoundingClientRect()
  const landscape = box.width > box.height
  insets.value = landscape
    ? { top: bar.bottom - box.top + 8, right: 16, bottom: 16, left: row.right - box.left + 12 }
    : { top: row.bottom - box.top + 12, right: 12, bottom: 24, left: 12 }
}

let observer: ResizeObserver | null = null
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  if (root.value) observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="root" class="safe-screen relative flex flex-col overflow-hidden bg-[#dff0ff]">
    <WebboFlat
      v-if="flat"
      class="absolute inset-0"
      :round="round" :solved="solved" :waiting="waiting" :calming="calming" :show-hint="showHint" :wiggling="wiggling"
      :finished="finished" :moves="moves"
      @pick="pick"
      @finale-done="showFeedback = true"
    />
    <WebboScene
      v-else
      class="absolute inset-0"
      :round="round" :solved="solved" :waiting="waiting" :calming="calming" :show-hint="showHint" :wiggling="wiggling"
      :nudges="nudges" :insets="insets" :celebration="celebration" :finished="finished" :moves="moves"
      @pick="pick"
      @unsupported="flat = true"
      @finale-done="showFeedback = true"
    />

    <!-- Controls float over the city; only the controls themselves catch taps. -->
    <div class="pointer-events-none relative z-10 flex flex-col gap-3 landscape:gap-2">
      <div ref="topBar" class="pointer-events-auto">
        <GameTopBar>
          <RoundProgress :current="roundNumber" :total="total" />
        </GameTopBar>
      </div>
      <section ref="targetRow" class="pointer-events-auto flex items-center gap-3 self-center landscape:flex-col-reverse landscape:self-start">
        <!-- Webbo's web move, to watch and copy again -->
        <button
          type="button"
          class="toy-press order-last grid size-16 shrink-0 place-items-center rounded-full bg-white text-lilac-ink landscape:order-first"
          aria-label="Show me Webbo's web move"
          @click="showMove"
        >
          <AppIcon name="hand" class="size-9" />
        </button>
        <button
          type="button"
          class="toy-press grid size-16 shrink-0 place-items-center rounded-full bg-white text-lilac-ink"
          :aria-label="`Catch the letter ${round.target.uppercase}. Tap to hear again.`"
          @click="game.instruct()"
        >
          <AppIcon name="speaker" class="size-8" />
        </button>
        <div
          class="rounded-[2rem] border-4 border-dashed border-lilac-ink/40 bg-lilac/90 p-1.5"
          :class="[(waiting || calming) && !solved && 'animate-glow', sampleBounce && 'animate-bounce-soft']"
          @animationend="sampleBounce = false"
        >
          <div class="size-[min(11vh,24vw)] min-h-18 min-w-18 landscape:size-[min(18vh,11vw)]">
            <AlphabetCard :key="round.target.id" :letter="round.target" size="sample" plain :show-lowercase="false" :speak-on-tap="false" class="animate-pop" @tap="game.instruct()" />
          </div>
        </div>
      </section>
    </div>

    <footer class="pointer-events-none absolute inset-x-0 bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-10 flex justify-center landscape:justify-end landscape:pr-6">
      <Transition enter-from-class="opacity-0 scale-50" enter-active-class="transition duration-300 delay-700">
        <RoundReward v-if="solved && !finished" class="pointer-events-auto" :celebration="celebration" @next="game.nextRound()" />
      </Transition>
    </footer>

    <GameFeedback
      v-if="finished && showFeedback"
      message="Great swinging!"
      :clip="clips.phrase(pack.phrases.greatSwinging)"
      @replay="game.restart()"
      @home="navigateTo(gameHome)"
    />
  </div>
</template>
