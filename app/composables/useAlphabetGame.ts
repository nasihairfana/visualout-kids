import { computed, ref } from 'vue'
import type { AlphabetLetter, AlphabetPack, SpokenClip } from '~/types/learning'
import { englishAlphabetPack } from '~/data/english-alphabets'

/**
 * Letters toddlers commonly confuse. We avoid putting these side by side in the
 * three-choice rounds so early success stays high.
 */
const LOOKALIKES: Record<string, string[]> = {
  b: ['d', 'p'], d: ['b', 'p'], p: ['b', 'd', 'q'], q: ['p', 'o'],
  m: ['n', 'w'], n: ['m', 'u'], w: ['m', 'v'], v: ['w', 'u', 'y'], u: ['n', 'v'],
  o: ['q', 'c'], c: ['o', 'g'], g: ['c'], e: ['f'], f: ['e'], i: ['l', 'j'], l: ['i'], j: ['i'],
}

export interface Round {
  target: AlphabetLetter
  choices: AlphabetLetter[]
}

/** Content + round helpers shared by all alphabet activities. */
export function useAlphabetGame(pack: AlphabetPack = englishAlphabetPack) {
  const letters = pack.letters

  const byId = (id: string | undefined | null) => letters.find(l => l.id === id?.toLowerCase())
  const indexOf = (letter: AlphabetLetter) => letters.findIndex(l => l.id === letter.id)

  /** Target + two clearly different distractors, shuffled. */
  function makeRound(exclude: string[] = [], choiceCount = 3): Round {
    const pool = letters.filter(l => !exclude.includes(l.id))
    const target = pickOne(pool.length ? pool : letters)
    const avoid = new Set([target.id, ...(LOOKALIKES[target.id] ?? [])])
    const distractors: AlphabetLetter[] = []
    for (const candidate of shuffle(letters)) {
      if (distractors.length >= choiceCount - 1) break
      if (avoid.has(candidate.id)) continue
      distractors.push(candidate)
      ;(LOOKALIKES[candidate.id] ?? []).forEach(id => avoid.add(id))
      avoid.add(candidate.id)
    }
    return { target, choices: shuffle([target, ...distractors]) }
  }

  // Ready-made clips so components don't need to know about asset paths.
  const clips = {
    letter: (l: AlphabetLetter): SpokenClip => ({ src: l.assets.letterAudio, text: l.spokenLetter }),
    word: (l: AlphabetLetter): SpokenClip => ({ src: l.assets.wordAudio, text: l.word }),
    objectSound: (l: AlphabetLetter): SpokenClip | null => (l.assets.objectSound ? { src: l.assets.objectSound } : null),
    phrase: (p: { text: string, audio: string | null }): SpokenClip => ({ src: p.audio, text: p.text }),
  }

  return { pack, letters, byId, indexOf, makeRound, clips }
}

/**
 * A short session of N rounds with "unlimited tries" semantics.
 * No score is kept — only how far along the child is, to know when to celebrate.
 */
export function useRoundSession(total: number, make: (exclude: string[]) => Round) {
  const seen: string[] = []
  const roundNumber = ref(1)
  const round = ref<Round>(make(seen))
  seen.push(round.value.target.id)

  const finished = ref(false)

  function next() {
    if (roundNumber.value >= total) {
      finished.value = true
      return
    }
    roundNumber.value++
    round.value = make(seen)
    seen.push(round.value.target.id)
  }

  function restart() {
    seen.length = 0
    roundNumber.value = 1
    finished.value = false
    round.value = make(seen)
    seen.push(round.value.target.id)
  }

  return { round, roundNumber, total, finished, next, restart, progress: computed(() => roundNumber.value / total) }
}
