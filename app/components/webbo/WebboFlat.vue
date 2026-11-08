<script setup lang="ts">
import type { Round } from '~/composables/useAlphabetGame'

/**
 * The same game without 3D, for devices that can't run WebGL: Webbo on a roof and three letter
 * balloons. Same props and events as WebboScene, so the rules and voice are identical.
 */
const props = defineProps<{
  round: Round
  solved: boolean
  waiting: boolean
  calming: boolean
  showHint: boolean
  wiggling: string | null
  finished: boolean
  moves: number
}>()
const emit = defineEmits<{ pick: [id: string], finaleDone: [] }>()

// Webbo does its move (wiggle, then point) when asked, and points at each catch.
const move = ref<'rest' | 'wiggle' | 'point' | 'up'>('rest')
let moveTimer: ReturnType<typeof setTimeout> | undefined
function doMove(then: 'point' | 'up') {
  clearTimeout(moveTimer)
  move.value = 'wiggle'
  moveTimer = setTimeout(() => {
    move.value = then
    moveTimer = setTimeout(() => { move.value = 'rest' }, 1400)
  }, 600)
}
watch(() => props.moves, () => doMove('point'))
watch(() => props.solved, (solved) => { if (solved) doMove('up') })
watch(() => props.finished, (finished) => {
  if (!finished) return
  move.value = 'up'
  setTimeout(() => emit('finaleDone'), 600)
})
onBeforeUnmount(() => clearTimeout(moveTimer))

const BALLOONS = ['bg-[#FFB59A]', 'bg-[#9CC8F5]', 'bg-[#9AD9B8]']
const OFFSETS = ['landscape:translate-y-6', 'landscape:-translate-y-6', 'landscape:translate-y-4']
</script>

<template>
  <div class="flex items-end justify-center gap-[6vw] px-4 pb-[10vh] pt-[30vh] landscape:items-center landscape:pb-6 landscape:pl-[16vw] landscape:pt-20">
    <!-- Webbo on a roof -->
    <!-- In a narrow portrait screen Webbo sits in the corner, out of the balloons' way. -->
    <div class="absolute bottom-0 left-3 flex shrink-0 flex-col items-center sm:static landscape:static">
      <WebboIcon
        :happy="solved"
        :pose="move === 'up' ? 'up' : move === 'rest' ? 'rest' : 'point'"
        :wiggle="move === 'wiggle'"
        class="w-[11vh] max-w-36 sm:w-[18vh]"
        :class="solved && 'animate-bounce-soft'"
      />
      <div class="h-[7vh] w-[14vh] max-w-44 rounded-t-2xl bg-lilac sm:h-[14vh] sm:w-[22vh]" />
    </div>

    <div
      class="flex flex-col items-center gap-[3vh] transition-opacity duration-300 sm:flex-row sm:gap-[4vw] landscape:flex-row landscape:gap-[4vw]"
      :class="!solved && (calming ? 'opacity-40' : waiting && 'opacity-70')"
    >
      <button
        v-for="(choice, i) in props.round.choices"
        :key="choice.id"
        type="button"
        class="relative flex flex-col items-center transition-all duration-300"
        :class="[
          OFFSETS[i],
          wiggling === choice.id && 'animate-wiggle',
          solved && choice.id !== props.round.target.id && '-translate-y-24 opacity-0',
        ]"
        :aria-label="`Letter ${choice.uppercase}`"
        :data-letter="choice.id"
        @click="emit('pick', choice.id)"
      >
        <span
          v-if="!(solved && choice.id === props.round.target.id)"
          class="grid size-[min(17vh,26vw)] min-h-20 min-w-20 place-items-center rounded-[50%_50%_48%_48%] text-[min(10vh,15vw)] font-black text-ink shadow-md"
          :class="[BALLOONS[i], showHint && !waiting && choice.id === props.round.target.id && 'animate-glow']"
        >{{ choice.uppercase }}</span>
        <span v-else class="grid size-[min(17vh,26vw)] min-h-20 min-w-20 animate-pop place-items-center rounded-3xl bg-white shadow-md">
          <ObjectIllustration :letter="choice" size="sm" />
        </span>
        <span class="h-8 w-px bg-ink/30" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
