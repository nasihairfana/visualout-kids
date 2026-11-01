/**
 * Shared content model for Visualout Kids learning games.
 *
 * Content lives in `app/data/*` and is language-specific; UI components only consume
 * these types, so a future Malayalam / Arabic / Hindi alphabet pack is a new data file,
 * not a new set of components.
 */

/** Visual theme name. Maps to pastel background + high-contrast ink in `utils/themes.ts`. */
export type CardTheme = 'peach' | 'mint' | 'sky' | 'lilac' | 'butter' | 'rose'

/**
 * Asset paths are `null` until a real file exists in `/public`.
 * We never point at files that have not been supplied — see ASSETS.md for the
 * expected file names and recording guidance.
 */
export interface LetterAssets {
  /** Illustration of the object, e.g. `/illustrations/apple.svg`. */
  illustration: string | null
  /** True while `illustration` is stand-in art awaiting the original Visualout Kids drawing. */
  illustrationIsPlaceholder: boolean
  /** Human recording of the letter name, e.g. `/audio/en/letters/a.mp3`. */
  letterAudio: string | null
  /** Human recording of the word, e.g. `/audio/en/words/apple.mp3`. */
  wordAudio: string | null
  /** Optional environmental / object sound, e.g. a crunch for Apple. */
  objectSound: string | null
}

export interface AlphabetLetter {
  /** Stable id, lowercase ASCII. Used for routes, progress and asset file names. */
  id: string
  uppercase: string
  lowercase: string
  /** The familiar object word, as shown to the child. */
  word: string
  /** What the device voice should say for the letter name when no recording exists. */
  spokenLetter: string
  /**
   * Last-resort fallback, rendered only when `assets.illustration` is null or fails to load.
   */
  fallbackEmoji: string
  theme: CardTheme
  assets: LetterAssets
}

/** Anything the audio service can say: a recording with an optional device-voice fallback. */
export interface SpokenClip {
  /** Local recording, or null when not supplied yet. */
  src: string | null
  /** Text for the device-voice fallback. Omit for non-speech sounds (no fallback). */
  text?: string
}

/** A short spoken phrase used for instructions and encouragement. */
export interface SpokenPhrase {
  text: string
  /** Human recording. `null` until supplied. */
  audio: string | null
}

export interface AlphabetPack {
  /** BCP 47 language tag, used to pick a device voice when recordings are missing. */
  lang: string
  letters: AlphabetLetter[]
  phrases: {
    whereIs: (letter: AlphabetLetter) => SpokenPhrase
    whichStartsWith: (letter: AlphabetLetter) => SpokenPhrase
    letterIsFor: (letter: AlphabetLetter) => SpokenPhrase
    /** Names a wrongly tapped letter, e.g. "That's M." */
    thatIs: (letter: AlphabetLetter) => SpokenPhrase
    /** Big praise, for picks made without the hint. */
    praise: SpokenPhrase[]
    /** Softer praise, for picks made after the hint appeared. */
    foundIt: SpokenPhrase
    /** Said when a wrong tap came too quickly to have been a real look. */
    lookCarefully: SpokenPhrase
    tryAgain: SpokenPhrase[]
    greatExploring: SpokenPhrase
    greatFinding: SpokenPhrase
    greatMatching: SpokenPhrase
  }
  /** Optional looping background track. Off by default; `null` = not installed. */
  backgroundMusic: string | null
}
