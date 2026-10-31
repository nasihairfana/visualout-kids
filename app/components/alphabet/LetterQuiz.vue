<script setup lang="ts">
/**
 * Mode 2 — Find the Letter. "Where is A?" with three big letters.
 */
const { clips, pack } = useAlphabetGame()

const game = useChoiceActivity({
  rounds: 5,
  instruction: t => [clips.phrase(pack.phrases.whereIs(t))],
  onCorrect: t => [clips.phrase(pack.phrases.letterIsFor(t))],
  onIncorrect: picked => [clips.letter(picked)],
})
const { round, roundNumber, total, finished, solved, showHint, wiggling } = game
</script>

<template>
  <div class="safe-screen flex flex-col gap-4 bg-sky/50">
    <GameTopBar>
      <RoundProgress :current="roundNumber" :total="total" />
    </GameTopBar>

    <section class="flex flex-col items-center gap-2">
      <button
        type="button"
        class="toy-press flex min-h-20 items-center gap-4 rounded-full bg-white py-3 pl-4 pr-8"
        :aria-label="`Where is ${round.target.uppercase}? Tap to hear again.`"
        @click="game.instruct()"
      >
        <span class="grid size-14 place-items-center rounded-full bg-sky text-sky-ink"><AppIcon name="speaker" class="size-8" /></span>
        <span class="text-3xl font-black text-ink sm:text-4xl">Where is {{ round.target.uppercase }}?</span>
      </button>
    </section>

    <main class="flex min-h-0 flex-1 flex-col items-center justify-center gap-[2.5vh] sm:flex-row sm:gap-[4vw] landscape:flex-row landscape:gap-[4vw]">
      <div
        v-for="choice in round.choices"
        :key="`${roundNumber}-${choice.id}`"
        class="size-[min(21vh,58vw)] shrink-0 transition-all duration-300 sm:size-[min(27vw,32vh)] landscape:size-[min(27vw,46vh)]"
        :class="[
          wiggling === choice.id && 'animate-wiggle',
          solved && choice.id !== round.target.id && 'scale-90 opacity-40',
          solved && choice.id === round.target.id && 'scale-105',
          showHint && choice.id === round.target.id && 'animate-glow rounded-blob',
        ]"
      >
        <AlphabetCard :letter="choice" size="choice" :show-lowercase="false" :speak-on-tap="false" :class="solved && choice.id === round.target.id && 'ring-8 ring-sunny'" @tap="game.pick" />
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
      message="Great finding!"
      :clip="clips.phrase(pack.phrases.greatFinding)"
      @replay="game.restart()"
      @home="navigateTo('/')"
    />
  </div>
</template>
