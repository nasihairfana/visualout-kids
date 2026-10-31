import { watch } from 'vue'

export interface SoundSettings {
  /** Master switch, also exposed to the child as the speaker toggle. */
  soundOn: boolean
  /** 0–1, applied to recordings, device voice and effects. */
  volume: number
  /** Optional looping music. Off by default. */
  musicOn: boolean
  /** Use the device's built-in (on-device) voice when a recording is missing. */
  deviceVoiceFallback: boolean
  /** Speak "Where is A?" automatically at the start of each round. */
  autoInstructions: boolean
}

const STORAGE_KEY = 'vk.abc.sound-settings.v1'

const DEFAULTS: SoundSettings = {
  soundOn: true,
  volume: 0.8,
  musicOn: false,
  deviceVoiceFallback: true,
  autoInstructions: true,
}

function load(): SoundSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  }
  catch {
    return { ...DEFAULTS }
  }
}

let persisting = false

/** Shared, persisted sound preferences. Stored only on this device. */
export function useSoundSettings() {
  const settings = useState<SoundSettings>('sound-settings', load)

  if (import.meta.client && !persisting) {
    persisting = true
    watch(settings, (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      }
      catch { /* storage unavailable (private mode) — settings just won't persist */ }
    }, { deep: true })
  }

  const toggleSound = () => {
    settings.value.soundOn = !settings.value.soundOn
  }

  const reset = () => {
    settings.value = { ...DEFAULTS }
  }

  return { settings, toggleSound, reset }
}
