<script setup lang="ts">
import type { Difficulty } from '~/games/numbers/rounds'
import { ROUNDS_PER_SESSION } from '~/games/numbers/rounds'
import type { NumberGame } from '~/data/number-games'
import CollectEngine from '~/components/numbers/engines/CollectEngine.vue'
import FindEngine from '~/components/numbers/engines/FindEngine.vue'
import SequenceEngine from '~/components/numbers/engines/SequenceEngine.vue'
import MatchEngine from '~/components/numbers/engines/MatchEngine.vue'

/**
 * One Numbers adventure: five rounds, a Next button after each, then the celebration with stars.
 * The rounds themselves are played by the game's engine; this screen keeps the session.
 */
const props = defineProps<{ game: NumberGame, difficulty: Difficulty }>()
const progress = useNumbersProgress()
const { effect, stop } = useAudio()

const ENGINES = { collect: CollectEngine, find: FindEngine, sequence: SequenceEngine, match: MatchEngine }
const step = ref(progress.stepOf(props.game.id, props.difficulty))
const index = ref(0)
const session = ref(0)
const solved = ref(false)
const finished = ref(false)
const unlocked = ref<NumberGame[]>([])

function onSolved() {
  solved.value = true
}
function next() {
  stop()
  effect('page')
  if (index.value < ROUNDS_PER_SESSION - 1) {
    index.value++
    solved.value = false
    return
  }
  unlocked.value = progress.complete(props.game.id, props.difficulty)
  finished.value = true
  effect('celebrate')
}
function again() {
  stop()
  step.value = progress.stepOf(props.game.id, props.difficulty)
  session.value++
  index.value = 0
  solved.value = false
  finished.value = false
  unlocked.value = []
}
</script>

<template>
  <div class="safe-screen relative flex flex-col gap-2 overflow-hidden">
    <NumbersScenery :world="game.world" />
    <div class="relative z-10">
      <GameTopBar>
        <div class="rounded-full bg-white/80 px-3 py-2">
          <RoundProgress :current="index + 1" :total="ROUNDS_PER_SESSION" />
        </div>
      </GameTopBar>
    </div>

    <main class="relative z-10 min-h-0 flex-1">
      <component
        :is="ENGINES[game.engine]"
        :key="`${session}-${index}`"
        :game="game"
        :difficulty="difficulty"
        :step="step"
        :index="index"
        @solved="onSolved"
      />
    </main>

    <Transition enter-from-class="translate-y-8 opacity-0" enter-active-class="transition duration-300">
      <div v-if="solved && !finished" class="fixed bottom-[max(env(safe-area-inset-bottom),1rem)] right-4 z-30 rounded-full bg-white/90 p-2 pl-4 shadow-lg" data-next>
        <RoundReward celebration="big" @next="next" />
      </div>
    </Transition>

    <NumbersSuccess
      v-if="finished"
      :game="game"
      :unlocked="unlocked"
      @replay="again"
      @home="navigateTo('/numbers')"
    />
  </div>
</template>
