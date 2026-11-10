import { computed, watch } from 'vue'
import type { Difficulty } from '~/games/trail/levels'
import { TRAIL_THEMES } from '~/data/trail-themes'

/**
 * Letter Trails progress, on this device only: which level each difficulty is on, the stars
 * earned, and the world last played. Stars are earned by finishing a level (never lost for
 * mistakes) and open up new worlds.
 */
interface TrailState {
  /** The next level to play, per difficulty (1-based). */
  level: Record<Difficulty, number>
  /** Best stars per finished level, keyed "difficulty:level". */
  stars: Record<string, number>
  theme: string
}

const STORAGE_KEY = 'vk.abc.trail.v1'
/** Every finished level earns all its stars: finishing is the achievement. */
export const STARS_PER_LEVEL = 3

const empty = (): TrailState => ({ level: { beginner: 1, challenge: 1, super: 1 }, stars: {}, theme: 'garden' })

function load(): TrailState {
  const base = empty()
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<TrailState> | null
    return saved ? { ...base, ...saved, level: { ...base.level, ...saved.level } } : base
  }
  catch {
    return base
  }
}

let persisting = false

export function useTrailProgress() {
  const state = useState<TrailState>('trail-progress', load)

  if (import.meta.client && !persisting) {
    persisting = true
    watch(state, (value) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) }
      catch { /* not persisted */ }
    }, { deep: true })
  }

  const totalStars = computed(() => Object.values(state.value.stars).reduce((sum, n) => sum + n, 0))
  const isUnlocked = (themeId: string) => totalStars.value >= (TRAIL_THEMES.find(t => t.id === themeId)?.unlockAt ?? Infinity)

  /**
   * Record a finished level. Returns the worlds this opened up (for "a new friend!" on the
   * success screen).
   */
  function complete(difficulty: Difficulty, level: number) {
    const before = new Set(TRAIL_THEMES.filter(t => isUnlocked(t.id)).map(t => t.id))
    const key = `${difficulty}:${level}`
    state.value.stars[key] = Math.max(state.value.stars[key] ?? 0, STARS_PER_LEVEL)
    if (state.value.level[difficulty] <= level) state.value.level[difficulty] = level + 1
    return TRAIL_THEMES.filter(t => !before.has(t.id) && isUnlocked(t.id))
  }

  function reset() {
    state.value = empty()
  }

  return {
    totalStars,
    levelOf: (difficulty: Difficulty) => state.value.level[difficulty],
    starsFor: (difficulty: Difficulty, level: number) => state.value.stars[`${difficulty}:${level}`] ?? 0,
    theme: computed({
      get: () => state.value.theme,
      set: (id: string) => { state.value.theme = id },
    }),
    isUnlocked,
    complete,
    reset,
  }
}
