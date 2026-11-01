import { computed, watch } from 'vue'

/**
 * Tiny, on-device-only progress memory: which letters the child has looked at, and
 * whether they picked each letter right on the first try in the choice games.
 * No identifiers, no timestamps, never leaves the device. Parents can clear it.
 */
export type PracticeMode = 'find' | 'match'

/** 0 = very different letters, 1 = any letters, 2 = includes a look-alike. */
export type ChoiceLevel = 0 | 1 | 2

export type LetterStatus = 'new' | 'practising' | 'known'

interface ProgressState {
  explored: string[]
  lastLetter: string | null
  /** Last few first-try outcomes per letter, per activity (true = right first time). */
  firstTry: Record<PracticeMode, Record<string, boolean[]>>
  /** Recent first-try outcomes per activity, used to adapt difficulty. */
  recent: Record<PracticeMode, boolean[]>
  level: Record<PracticeMode, ChoiceLevel>
}

const STORAGE_KEY = 'vk.abc.progress.v1'

/** How many outcomes we keep per letter, and how many first tries in a row count as "known". */
const LETTER_WINDOW = 4
const KNOWN_STREAK = 3
/** Rounds looked at before the difficulty moves, and the first-try rates that move it. */
const ROUND_WINDOW = 6
const MIN_ROUNDS = 5
const LEVEL_UP_RATE = 0.8
const LEVEL_DOWN_RATE = 0.4

const empty = (): ProgressState => ({
  explored: [],
  lastLetter: null,
  firstTry: { find: {}, match: {} },
  recent: { find: [], match: [] },
  level: { find: 0, match: 0 },
})

function load(): ProgressState {
  const base = empty()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const saved = JSON.parse(raw) as Partial<ProgressState>
    // Older saves only had `explored` / `lastLetter`; fill in anything missing.
    return {
      ...base,
      ...saved,
      firstTry: { ...base.firstTry, ...saved.firstTry },
      recent: { ...base.recent, ...saved.recent },
      level: { ...base.level, ...saved.level },
    }
  }
  catch {
    return base
  }
}

let persisting = false

export function useGameProgress() {
  const state = useState<ProgressState>('game-progress', load)

  if (import.meta.client && !persisting) {
    persisting = true
    watch(state, (value) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) }
      catch { /* not persisted */ }
    }, { deep: true })
  }

  const exploredSet = computed(() => new Set(state.value.explored))

  function markExplored(id: string) {
    state.value.lastLetter = id
    if (!exploredSet.value.has(id)) state.value.explored = [...state.value.explored, id]
  }

  /** Remember one solved round, and nudge the difficulty up or down when the trend is clear. */
  function recordRound(mode: PracticeMode, letterId: string, firstTry: boolean) {
    const perLetter = state.value.firstTry[mode]
    perLetter[letterId] = [...(perLetter[letterId] ?? []), firstTry].slice(-LETTER_WINDOW)

    const recent = [...state.value.recent[mode], firstTry].slice(-ROUND_WINDOW)
    const rate = recent.filter(Boolean).length / recent.length
    const level = state.value.level[mode]
    if (recent.length >= MIN_ROUNDS && rate >= LEVEL_UP_RATE && level < 2) {
      state.value.level[mode] = (level + 1) as ChoiceLevel
      state.value.recent[mode] = []
    }
    else if (recent.length >= MIN_ROUNDS && rate <= LEVEL_DOWN_RATE && level > 0) {
      state.value.level[mode] = (level - 1) as ChoiceLevel
      state.value.recent[mode] = []
    }
    else {
      state.value.recent[mode] = recent
    }
  }

  function letterStatus(mode: PracticeMode, letterId: string): LetterStatus {
    const history = state.value.firstTry[mode][letterId] ?? []
    if (!history.length) return 'new'
    const streak = history.slice(-KNOWN_STREAK)
    return streak.length === KNOWN_STREAK && streak.every(Boolean) ? 'known' : 'practising'
  }

  function reset() {
    state.value = empty()
  }

  return {
    exploredSet,
    exploredCount: computed(() => state.value.explored.length),
    lastLetter: computed(() => state.value.lastLetter),
    markExplored,
    levelOf: (mode: PracticeMode) => state.value.level[mode],
    recordRound,
    letterStatus,
    reset,
  }
}
