import type { Difficulty } from '~/games/numbers/rounds'
import { NUMBER_GAMES } from '~/data/number-games'

/**
 * Numbers & Counting progress, on this device only: the chosen difficulty and, per game and
 * difficulty, how many sessions were finished. Every finished session earns 3 stars; nothing
 * is ever taken away. Stars open more adventures.
 */
const STORAGE_KEY = 'vk.numbers.v1'
export const STARS_PER_SESSION = 3

interface NumbersState {
  difficulty: Difficulty
  /** "gameId:difficulty" → sessions finished. */
  sessions: Record<string, number>
}

const empty = (): NumbersState => ({ difficulty: 'beginner', sessions: {} })

function load(): NumbersState {
  const base = empty()
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<NumbersState> | null
    return saved ? { ...base, ...saved, sessions: { ...saved.sessions } } : base
  }
  catch {
    return base
  }
}

let persisting = false

export function useNumbersProgress() {
  const state = useState<NumbersState>('numbers-progress', load)

  if (import.meta.client && !persisting) {
    persisting = true
    watch(state, (value) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) }
      catch { /* not persisted */ }
    }, { deep: true })
  }

  const totalStars = computed(() => Object.values(state.value.sessions).reduce((sum, n) => sum + n * STARS_PER_SESSION, 0))
  const isUnlocked = (gameId: string) => totalStars.value >= (NUMBER_GAMES.find(g => g.id === gameId)?.unlockAt ?? Infinity)
  /** Sessions finished: drives the gentle ramp inside a difficulty. */
  const stepOf = (gameId: string, difficulty: Difficulty) => state.value.sessions[`${gameId}:${difficulty}`] ?? 0
  const starsFor = (gameId: string) => Object.entries(state.value.sessions)
    .filter(([key]) => key.startsWith(`${gameId}:`))
    .reduce((sum, [, n]) => sum + n * STARS_PER_SESSION, 0)

  /** Record a finished session. Returns the adventures this opened up. */
  function complete(gameId: string, difficulty: Difficulty) {
    const before = new Set(NUMBER_GAMES.filter(g => isUnlocked(g.id)).map(g => g.id))
    const key = `${gameId}:${difficulty}`
    state.value.sessions[key] = (state.value.sessions[key] ?? 0) + 1
    return NUMBER_GAMES.filter(g => !before.has(g.id) && isUnlocked(g.id))
  }

  return {
    totalStars,
    isUnlocked,
    stepOf,
    starsFor,
    difficulty: computed({
      get: () => state.value.difficulty,
      set: (d: Difficulty) => { state.value.difficulty = d },
    }),
    complete,
    reset: () => { state.value = empty() },
  }
}
