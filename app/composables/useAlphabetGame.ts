import { computed, ref } from 'vue'
import type { AlphabetLetter, AlphabetPack, SpokenClip } from '~/types/learning'
import { englishAlphabetPack } from '~/data/english-alphabets'
import type { ChoiceLevel } from '~/composables/useGameProgress'

/**
 * Capital letters toddlers commonly confuse (Find the letter shows capitals only).
 * Each string is a group of shapes that look alike; the map below links every pair.
 */
const LOOKALIKE_GROUPS = ['BPR', 'BD', 'DO', 'OQCG', 'EF', 'FP', 'MNW', 'NH', 'VUWY', 'UJ', 'ILTJ', 'TY', 'KXR', 'XY', 'ZS', 'ZN']
const LOOKALIKES: Record<string, string[]> = {}
for (const group of LOOKALIKE_GROUPS) {
  for (const a of group.toLowerCase()) {
    for (const b of group.toLowerCase()) {
      if (a !== b && !LOOKALIKES[a]?.includes(b)) (LOOKALIKES[a] ??= []).push(b)
    }
  }
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

  /**
   * Target + distractors, shuffled. `level` sets how alike they look:
   * 0 = clearly different shapes, 1 = any letters, 2 = one look-alike when the target has one.
   */
  function makeRound(exclude: string[] = [], level: ChoiceLevel = 0, choiceCount = 3): Round {
    const pool = letters.filter(l => !exclude.includes(l.id))
    const target = pickOne(pool.length ? pool : letters)
    const distractors: AlphabetLetter[] = []
    if (level >= 2) {
      const twin = shuffle(LOOKALIKES[target.id] ?? []).map(byId).find(Boolean)
      if (twin) distractors.push(twin)
    }
    const avoid = new Set([target.id, ...distractors.map(d => d.id)])
    if (level === 0) (LOOKALIKES[target.id] ?? []).forEach(id => avoid.add(id))
    for (const candidate of shuffle(letters)) {
      if (distractors.length >= choiceCount - 1) break
      if (avoid.has(candidate.id)) continue
      distractors.push(candidate)
      avoid.add(candidate.id)
      if (level === 0) (LOOKALIKES[candidate.id] ?? []).forEach(id => avoid.add(id))
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
