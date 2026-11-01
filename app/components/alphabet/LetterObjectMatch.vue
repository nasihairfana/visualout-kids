<script setup lang="ts">
/**
 * Mode 3 — Match Letter to Object. Show "A", pick the apple from three objects.
 */
const { clips, pack } = useAlphabetGame()

const game = useChoiceActivity({
  mode: 'match',
  rounds: 5,
  instruction: t => [clips.phrase(pack.phrases.whichStartsWith(t))],
  onCorrect: t => [clips.phrase(pack.phrases.letterIsFor(t))],
  onIncorrect: picked => [clips.word(picked)],
})
const { round, roundNumber, total, finished, solved, showHint, wiggling, waiting, calming, nudges, celebration } = game

// Tapping while the pictures wait bounces the letter to look at.
const letterBounce = ref(false)
watch(nudges, () => {
  letterBounce.value = false
  requestAnimationFrame(() => { letterBounce.value = true })
})
</script>

<template>
  <div class="safe-screen flex flex-col gap-3 bg-mint/50">
    <GameTopBar>
      <RoundProgress :current="roundNumber" :total="total" />
    </GameTopBar>

    <main class="flex min-h-0 flex-1 flex-col items-center justify-center gap-[3vh] landscape:flex-row landscape:gap-[5vw]">
      <div class="flex flex-col items-center gap-3">
        <div
          class="rounded-blob"
          :class="[(waiting || calming) && !solved && 'animate-glow', letterBounce && 'animate-bounce-soft']"
          @animationend="letterBounce = false"
        >
          <AlphabetCard :key="round.target.id" :letter="round.target" class="animate-pop" />
        </div>
        <button
          type="button"
          class="toy-press grid size-16 place-items-center rounded-full bg-white text-ink"
          :aria-label="`Which one starts with ${round.target.uppercase}? Tap to hear again.`"
          @click="game.instruct()"
        >
          <AppIcon name="speaker" class="size-8" />
        </button>
      </div>

      <div
        class="grid w-full max-w-xl grid-cols-3 gap-[3vw] transition-opacity duration-300 landscape:max-w-[min(58vw,105vh)]"
        :class="!solved && (calming ? 'opacity-40' : waiting && 'opacity-70')"
      >
        <button
          v-for="choice in round.choices"
          :key="`${roundNumber}-${choice.id}`"
          type="button"
          class="toy-press grid aspect-square place-items-center rounded-[2rem] bg-white p-2 transition-all duration-300"
          :class="[
            wiggling === choice.id && 'animate-wiggle',
            calming && !solved && 'scale-95',
            solved && choice.id !== round.target.id && 'scale-90 opacity-40',
            solved && choice.id === round.target.id && 'scale-105 ring-8 ring-sunny',
            showHint && !waiting && choice.id === round.target.id && 'animate-glow',
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
        <RoundReward v-if="solved" :celebration="celebration" @next="game.nextRound()" />
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
