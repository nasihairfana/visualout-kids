<script setup lang="ts">
/**
 * Mode 2 — Find the Letter. "Where is A?" with a picture of A to match and three big letters.
 * Every card is plain white with dark ink, so the only way to find the twin is by its shape.
 */
const { clips, pack } = useAlphabetGame()

const game = useChoiceActivity({
  mode: 'find',
  rounds: 5,
  adaptive: true,
  instruction: t => [clips.phrase(pack.phrases.whereIs(t))],
  onCorrect: t => [clips.phrase(pack.phrases.letterIsFor(t))],
  onIncorrect: picked => [clips.phrase(pack.phrases.thatIs(picked))],
})
const { round, roundNumber, total, finished, solved, showHint, wiggling, waiting, calming, nudges, celebration } = game

// Tapping while the choices wait bounces the letter to look at.
const sampleBounce = ref(false)
watch(nudges, () => {
  sampleBounce.value = false
  requestAnimationFrame(() => { sampleBounce.value = true })
})
const gameHome = useGameHome()
</script>

<template>
  <div class="safe-screen flex flex-col gap-3 bg-sky/50">
    <GameTopBar>
      <RoundProgress :current="roundNumber" :total="total" />
    </GameTopBar>

    <div class="flex min-h-0 flex-1 flex-col gap-3 landscape:flex-row landscape:items-center landscape:justify-center landscape:gap-[5vw]">
      <section class="flex items-center justify-center gap-4 landscape:flex-col-reverse">
        <button
          type="button"
          class="toy-press grid size-16 shrink-0 place-items-center rounded-full bg-white text-sky-ink"
          :aria-label="`Where is ${round.target.uppercase}? Tap to hear again.`"
          @click="game.instruct()"
        >
          <AppIcon name="speaker" class="size-8" />
        </button>
        <div
          class="rounded-[2.4rem] border-4 border-dashed border-sky-ink/40 bg-sky p-2"
          :class="[(waiting || calming) && !solved && 'animate-glow', sampleBounce && 'animate-bounce-soft']"
          @animationend="sampleBounce = false"
        >
          <div class="size-[min(13vh,30vw)] landscape:size-[min(20vh,13vw)]">
            <AlphabetCard :key="round.target.id" :letter="round.target" size="sample" plain :show-lowercase="false" :speak-on-tap="false" class="animate-pop" @tap="game.instruct()" />
          </div>
        </div>
      </section>

      <main
        class="flex min-h-0 flex-1 flex-col items-center justify-center gap-[1.8vh] transition-opacity duration-300 sm:flex-row sm:gap-[4vw] landscape:flex-none landscape:flex-row landscape:gap-[3vw]"
        :class="!solved && (calming ? 'opacity-40' : waiting && 'opacity-70')"
      >
        <div
          v-for="choice in round.choices"
          :key="`${roundNumber}-${choice.id}`"
          class="size-[min(16.5vh,50vw)] shrink-0 transition-all duration-300 sm:size-[min(27vw,30vh)] landscape:size-[min(20vw,40vh)]"
          :class="[
            wiggling === choice.id && 'animate-wiggle',
            calming && !solved && 'scale-95',
            solved && choice.id !== round.target.id && 'scale-90 opacity-40',
            solved && choice.id === round.target.id && 'scale-105',
            showHint && !waiting && choice.id === round.target.id && 'animate-glow rounded-blob',
          ]"
        >
          <AlphabetCard :letter="choice" size="choice" plain :show-lowercase="false" :speak-on-tap="false" :class="solved && choice.id === round.target.id && 'ring-8 ring-sunny'" @tap="game.pick" />
        </div>
      </main>
    </div>

    <footer class="flex h-24 items-center justify-center">
      <Transition enter-from-class="opacity-0 scale-50" enter-active-class="transition duration-300">
        <RoundReward v-if="solved" :celebration="celebration" @next="game.nextRound()" />
      </Transition>
    </footer>

    <GameFeedback
      v-if="finished"
      message="Great finding!"
      :clip="clips.phrase(pack.phrases.greatFinding)"
      @replay="game.restart()"
      @home="navigateTo(gameHome)"
    />
  </div>
</template>
