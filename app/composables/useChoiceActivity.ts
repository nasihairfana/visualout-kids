import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { AlphabetLetter, SpokenClip } from '~/types/learning'

interface ChoiceActivityOptions {
  rounds: number
  /** What to say at the start of a round, e.g. "Where is A?". */
  instruction: (target: AlphabetLetter) => SpokenClip[]
  /** What to say on a correct pick (after a praise phrase). */
  onCorrect: (target: AlphabetLetter) => SpokenClip[]
  /** What to say for a gentle "not this one" — usually the name of what was tapped. */
  onIncorrect: (picked: AlphabetLetter) => SpokenClip[]
}

/**
 * Shared engine for "pick one of three" activities.
 * - Unlimited attempts, no score, no timer.
 * - Wrong picks get a wiggle and encouragement, never a red state or a buzzer.
 * - After two misses the right answer softly glows as a hint.
 * - The next round only starts when the child taps "next".
 */
export function useChoiceActivity(opts: ChoiceActivityOptions) {
  const { makeRound, clips, pack } = useAlphabetGame()
  const { say, effect, stop } = useAudio()
  const { settings } = useSoundSettings()

  const session = useRoundSession(opts.rounds, exclude => makeRound(exclude))
  const solved = ref(false)
  const misses = ref(0)
  const wiggling = ref<string | null>(null)
  const showHint = computed(() => !solved.value && misses.value >= 2)

  const instruct = () => say(opts.instruction(session.round.value.target))

  function startRound() {
    solved.value = false
    misses.value = 0
    wiggling.value = null
    if (settings.value.autoInstructions) setTimeout(instruct, 350)
  }

  function pick(letter: AlphabetLetter) {
    if (solved.value) {
      // Already solved: let the child keep hearing what they tap.
      if (letter.id === session.round.value.target.id) say(opts.onCorrect(letter))
      return
    }
    const target = session.round.value.target
    if (letter.id === target.id) {
      solved.value = true
      effect('success')
      say([clips.phrase(pickOne(pack.phrases.praise)), ...opts.onCorrect(target)])
    }
    else {
      misses.value++
      wiggling.value = null
      requestAnimationFrame(() => { wiggling.value = letter.id })
      effect('tryAgain')
      say([...opts.onIncorrect(letter), clips.phrase(pickOne(pack.phrases.tryAgain)), ...opts.instruction(target)])
    }
  }

  function nextRound() {
    effect('page')
    stop()
    session.next()
  }

  function restart() {
    session.restart()
  }

  watch(session.round, startRound)
  onMounted(startRound)
  onBeforeUnmount(stop)

  return {
    round: session.round,
    roundNumber: session.roundNumber,
    total: session.total,
    finished: session.finished,
    solved,
    showHint,
    wiggling,
    pick,
    instruct,
    nextRound,
    restart,
  }
}
