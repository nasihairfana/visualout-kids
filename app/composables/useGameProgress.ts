import { computed, watch } from 'vue'

/**
 * Tiny, on-device-only progress memory: which letters the child has looked at.
 * No identifiers, no timestamps, never leaves the device. Parents can clear it.
 */
interface ProgressState {
  explored: string[]
  lastLetter: string | null
}

const STORAGE_KEY = 'vk.abc.progress.v1'
const EMPTY: ProgressState = { explored: [], lastLetter: null }

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY }
  }
  catch {
    return { ...EMPTY }
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

  function reset() {
    state.value = { ...EMPTY, explored: [] }
  }

  return {
    exploredSet,
    exploredCount: computed(() => state.value.explored.length),
    lastLetter: computed(() => state.value.lastLetter),
    markExplored,
    reset,
  }
}
