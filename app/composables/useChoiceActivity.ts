import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { AlphabetLetter, SpokenClip } from '~/types/learning'
import type { PracticeMode } from '~/composables/useGameProgress'

interface ChoiceActivityOptions {
  /** Which activity this is, for on-device progress and difficulty. */
  mode: PracticeMode
  rounds: number
  /** Let the distractors get closer to the target as the child gets things right first time. */
  adaptive?: boolean
  /** What to say at the start of a round, e.g. "Where is A?". */
  instruction: (target: AlphabetLetter) => SpokenClip[]
  /** What to say on a correct pick (after a praise phrase). */
  onCorrect: (target: AlphabetLetter) => SpokenClip[]
  /** What to say for a gentle "not this one" — usually the name of what was tapped. */
  onIncorrect: (picked: AlphabetLetter) => SpokenClip[]
}

/** 'big' = found without the hint; 'gentle' = found once the hint was showing. */
export type Celebration = 'big' | 'gentle'

/** A wrong tap sooner than this after the choices wake up is treated as a guess, not a look. */
const TOO_QUICK_MS = 800
/** Never keep the choices waiting longer than this, even if a voice never reports it finished. */
const MAX_WAIT_MS = 5000
/** How long the "settle down and look" pause lasts at least, even with sound off. */
const CALM_MS = 1600
/** The question keeps the choices waiting at least this long, so there's a moment to look even in silence. */
const LOOK_MS = 1000

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

/**
 * Shared engine for "pick one of three" activities.
 * - Unlimited attempts, no score, no timer.
 * - The choices wait (dimmed) while the question is being asked, so the child listens and looks
 *   before tapping. A tap while waiting just nudges the letter to look at.
 * - Wrong picks get a wiggle and hear what they tapped, never a red state or a buzzer.
 *   A wrong pick made too quickly to be a real look starts a short calm pause instead.
 * - After two misses the right answer softly glows as a hint, and the celebration is gentler,
 *   so the big reward goes to looking rather than to tapping everything.
 * - The next round only starts when the child taps "next".
 */
export function useChoiceActivity(opts: ChoiceActivityOptions) {
  const { makeRound, clips, pack } = useAlphabetGame()
  const { say, effect, stop } = useAudio()
  const { settings } = useSoundSettings()
  const progress = useGameProgress()

  const session = useRoundSession(opts.rounds, exclude => makeRound(exclude, opts.adaptive ? progress.levelOf(opts.mode) : 0))
  const solved = ref(false)
  const misses = ref(0)
  const wiggling = ref<string | null>(null)
  /** The choices are waiting for the question (or the feedback) to finish. */
  const waiting = ref(false)
  /** A too-quick wrong tap: everything settles and the letter to look at pulses. */
  const calming = ref(false)
  /** Bumped when the child taps while the choices are waiting. */
  const nudges = ref(0)
  const celebration = ref<Celebration>('big')
  const showHint = computed(() => !solved.value && misses.value >= 2)

  let waitId = 0
  let readyAt = 0
  let startTimer: ReturnType<typeof setTimeout> | undefined

  function ready() {
    waitId++
    waiting.value = false
    calming.value = false
    readyAt = performance.now()
  }

  /** Say something while the choices wait, then wake them up. */
  async function sayWhileWaiting(spoken: SpokenClip[], minMs = 0) {
    const id = ++waitId
    waiting.value = true
    await Promise.all([Promise.race([say(spoken), wait(MAX_WAIT_MS)]), wait(minMs)])
    if (id === waitId) ready()
  }

  const instruct = () => {
    const spoken = opts.instruction(session.round.value.target)
    return solved.value ? say(spoken) : sayWhileWaiting(spoken, LOOK_MS)
  }

  function startRound() {
    clearTimeout(startTimer)
    solved.value = false
    misses.value = 0
    wiggling.value = null
    // Wait from the very first frame so a tap can't sneak in before the question.
    waitId++
    waiting.value = true
    if (settings.value.autoInstructions) startTimer = setTimeout(instruct, 350)
    else startTimer = setTimeout(() => sayWhileWaiting([], LOOK_MS), 0)
  }

  function pick(letter: AlphabetLetter) {
    const target = session.round.value.target
    if (solved.value) {
      // Already solved: let the child keep hearing what they tap.
      if (letter.id === target.id) say(opts.onCorrect(letter))
      return
    }
    if (waiting.value) {
      nudges.value++
      return
    }
    if (letter.id === target.id) {
      const helped = misses.value >= 2
      progress.recordRound(opts.mode, target.id, misses.value === 0)
      celebration.value = helped ? 'gentle' : 'big'
      solved.value = true
      effect(helped ? 'found' : 'success')
      say([clips.phrase(helped ? pack.phrases.foundIt : pickOne(pack.phrases.praise)), ...opts.onCorrect(target)])
      return
    }

    const tooQuick = performance.now() - readyAt < TOO_QUICK_MS
    misses.value++
    wiggling.value = null
    requestAnimationFrame(() => { wiggling.value = letter.id })
    effect('tryAgain')
    if (tooQuick) {
      calming.value = true
      sayWhileWaiting([...opts.onIncorrect(letter), clips.phrase(pack.phrases.lookCarefully), ...opts.instruction(target)], CALM_MS)
    }
    else {
      sayWhileWaiting([...opts.onIncorrect(letter), clips.phrase(pickOne(pack.phrases.tryAgain)), ...opts.instruction(target)])
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
  onBeforeUnmount(() => {
    clearTimeout(startTimer)
    waitId++
    stop()
  })

  return {
    round: session.round,
    roundNumber: session.roundNumber,
    total: session.total,
    finished: session.finished,
    solved,
    showHint,
    wiggling,
    waiting,
    calming,
    nudges,
    celebration,
    pick,
    instruct,
    nextRound,
    restart,
  }
}
