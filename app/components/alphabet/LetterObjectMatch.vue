<script setup lang="ts">
/**
 * Mode 3 — Match Letter to Object. Show "A", pick the apple from three objects.
 */
const { clips, pack } = useAlphabetGame()

const game = useChoiceActivity({
  rounds: 5,
  instruction: t => [clips.phrase(pack.phrases.whichStartsWith(t))],
  onCorrect: t => [clips.phrase(pack.phrases.letterIsFor(t))],
  onIncorrect: picked => [clips.word(picked)],
})
const { round, roundNumber, total, finished, solved, showHint, wiggling } = game
</script>

<template>
  <div class="safe-screen flex flex-col gap-3 bg-mint/50">
    <GameTopBar>
      <RoundProgress :current="roundNumber" :total="total" />
    </GameTopBar>

    <main class="flex min-h-0 flex-1 flex-col items-center justify-center gap-[3vh] landscape:flex-row landscape:gap-[5vw]">
      <div class="flex flex-col items-center gap-3">
        <AlphabetCard :key="round.target.id" :letter="round.target" class="animate-pop" />
        <button
          type="button"
          class="toy-press grid size-16 place-items-center rounded-full bg-white text-ink"
          :aria-label="`Which one starts with ${round.target.uppercase}? Tap to hear again.`"
          @click="game.instruct()"
        >
          <AppIcon name="speaker" class="size-8" />
        </button>
      </div>

      <div class="grid w-full max-w-xl grid-cols-3 gap-[3vw] landscape:max-w-[min(58vw,105vh)]">
        <button
          v-for="choice in round.choices"
          :key="`${roundNumber}-${choice.id}`"
          type="button"
          class="toy-press grid aspect-square place-items-center rounded-[2rem] bg-white p-2 transition-all duration-300"
          :class="[
            wiggling === choice.id && 'animate-wiggle',
            solved && choice.id !== round.target.id && 'scale-90 opacity-40',
            solved && choice.id === round.target.id && 'scale-105 ring-8 ring-sunny',
            showHint && choice.id === round.target.id && 'animate-glow',
          ]"
          :aria-label="choice.word"
          @click="game.pick(choice)"
        >
          <ObjectIllustration :letter="choice" size="md" />
          <span v-if="solved && choice.id === round.target.id" class="text-2xl font-black text-ink">{{ choice.word }}</span>
        </button>
      </div>
    </main>

    <footer class="flex h-24 items-center justify-center">
      <Transition enter-from-class="opacity-0 scale-50" enter-active-class="transition duration-300">
        <div v-if="solved" class="flex items-center gap-4">
          <AppIcon name="star" class="size-16 animate-pop text-sunny drop-shadow" />
          <button type="button" class="toy-press grid size-24 place-items-center rounded-full bg-sunny text-ink" aria-label="Next" @click="game.nextRound()">
            <AppIcon name="next" class="size-12 animate-nudge" />
          </button>
        </div>
      </Transition>
    </footer>

    <GameFeedback
      v-if="finished"
      message="Great matching!"
      :clip="clips.phrase(pack.phrases.greatMatching)"
      @replay="game.restart()"
      @home="navigateTo('/')"
    />
  </div>
</template>
