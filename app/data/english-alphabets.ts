import type { AlphabetLetter, AlphabetPack, CardTheme, LetterAssets, SpokenPhrase } from '~/types/learning'
import audioManifest from './audio-manifest.json' with { type: 'json' }
import { numbersAudioCatalog } from './english-numbers.ts'
import { TRAIL_THEMES, type TrailTheme } from './trail-themes.ts'

/**
 * English A–Z content for "My First ABC".
 *
 * ASSET STATUS (keep in sync with ASSETS.md):
 * - Illustrations: PLACEHOLDERS. Simple SVGs in /public/illustrations stand in until the
 *   original Visualout Kids artwork is ready. Replace a file in place and add its id to
 *   `FINAL_ART` below.
 * - Audio: GENERATED. `npm run audio` voices every clip with an offline neural voice and
 *   writes `audio-manifest.json`. Anything still missing falls back to the device's
 *   on-device voice (if allowed in Parent settings) or stays silent.
 *
 * To add a human recording: drop the file into /public at the path listed in ASSETS.md and
 * re-run `npm run audio`. It never overwrites a file it didn't generate.
 */

/** Clips that exist in /public/audio/en, as found on disk by `npm run audio`. */
const RECORDED = {
  letters: new Set<string>(audioManifest.letters),
  /** Letter ids, e.g. 'a' for apple.mp3. */
  words: new Set<string>(audioManifest.words),
  objects: new Set<string>(audioManifest.objects),
  /** Phrase file names (without .mp3), e.g. 'wonderful', 'where-is-a'. */
  phrases: new Set<string>(audioManifest.phrases),
}

/** Letters whose /public/illustrations file is final artwork rather than a placeholder. */
const FINAL_ART = new Set<string>([])

const THEMES: CardTheme[] = ['peach', 'mint', 'sky', 'lilac', 'butter', 'rose']

const slug = (word: string) => word.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')

/** Where each clip lives, whether or not it exists yet. File names are listed in ASSETS.md. */
const audioPaths = {
  letter: (id: string) => `/audio/en/letters/${id}.mp3`,
  word: (word: string) => `/audio/en/words/${slug(word)}.mp3`,
  object: (word: string) => `/audio/en/objects/${slug(word)}.mp3`,
  phrase: (id: string) => `/audio/en/phrases/${id}.mp3`,
}

function assetsFor(id: string, word: string): LetterAssets {
  return {
    illustration: `/illustrations/${slug(word)}.svg`,
    illustrationIsPlaceholder: !FINAL_ART.has(id),
    letterAudio: RECORDED.letters.has(id) ? audioPaths.letter(id) : null,
    wordAudio: RECORDED.words.has(id) ? audioPaths.word(word) : null,
    objectSound: RECORDED.objects.has(id) ? audioPaths.object(word) : null,
  }
}

const RAW: Array<[upper: string, word: string, emoji: string]> = [
  ['A', 'Apple', '🍎'],
  ['B', 'Ball', '⚽'],
  ['C', 'Cat', '🐱'],
  ['D', 'Dog', '🐶'],
  ['E', 'Elephant', '🐘'],
  ['F', 'Fish', '🐟'],
  ['G', 'Goat', '🐐'],
  ['H', 'House', '🏠'],
  ['I', 'Ice cream', '🍦'],
  ['J', 'Juice', '🧃'],
  ['K', 'Kite', '🪁'],
  ['L', 'Lion', '🦁'],
  ['M', 'Mango', '🥭'],
  ['N', 'Nest', '🪺'],
  ['O', 'Orange', '🍊'],
  ['P', 'Parrot', '🦜'],
  ['Q', 'Queen', '👸'],
  ['R', 'Rabbit', '🐰'],
  ['S', 'Sun', '☀️'],
  ['T', 'Tiger', '🐯'],
  ['U', 'Umbrella', '☂️'],
  ['V', 'Van', '🚐'],
  ['W', 'Watermelon', '🍉'],
  ['X', 'Xylophone', '🎶'],
  ['Y', 'Yo-yo', '🪀'],
  ['Z', 'Zebra', '🦓'],
]

export const englishAlphabets: AlphabetLetter[] = RAW.map(([upper, word, emoji], index) => {
  const id = upper.toLowerCase()
  return {
    id,
    uppercase: upper,
    lowercase: id,
    word,
    spokenLetter: upper,
    fallbackEmoji: emoji,
    theme: THEMES[index % THEMES.length]!,
    assets: assetsFor(id, word),
  }
})

const phrase = (text: string, id: string): SpokenPhrase => ({
  id,
  text,
  audio: RECORDED.phrases.has(id) ? audioPaths.phrase(id) : null,
})

/** Letter Trails: what a friend says on arrival, e.g. "Bunny found the carrots!" */
export const arrivalPhrase = (theme: TrailTheme): SpokenPhrase => phrase(theme.arrival, `arrival-${theme.id}`)

export const englishAlphabetPack: AlphabetPack = {
  lang: 'en',
  letters: englishAlphabets,
  phrases: {
    whereIs: (l) => phrase(`Where is ${l.spokenLetter}?`, `where-is-${l.id}`),
    whichStartsWith: (l) => phrase(`${l.spokenLetter}. Which one starts with ${l.spokenLetter}?`, `which-starts-with-${l.id}`),
    letterIsFor: (l) => phrase(`${l.spokenLetter} is for ${l.word}!`, `${l.id}-is-for`),
    thatIs: (l) => phrase(`That's ${l.spokenLetter}.`, `thats-${l.id}`),
    praise: [phrase('Wonderful!', 'wonderful'), phrase('Yay! Well done!', 'well-done')],
    foundIt: phrase('You found it!', 'you-found-it'),
    lookCarefully: phrase('Look carefully!', 'look-carefully'),
    tryAgain: [phrase("Let's try again!", 'try-again'), phrase('Almost! Try another one.', 'almost')],
    greatExploring: phrase('Great exploring!', 'great-exploring'),
    greatFinding: phrase('Great finding!', 'great-finding'),
    greatMatching: phrase('Great matching!', 'great-matching'),
    letsWrite: (l) => phrase(`Let's write ${l.spokenLetter}!`, `lets-write-${l.id}`),
    youWrote: (l) => phrase(`You wrote ${l.spokenLetter}!`, `you-wrote-${l.id}`),
    greatWriting: phrase('Great writing!', 'great-writing'),
    catchTheLetter: (l) => phrase(`Catch the letter ${l.spokenLetter}!`, `catch-the-letter-${l.id}`),
    greatSwinging: phrase('Great swinging!', 'great-swinging'),
    followTheLetter: (l) => phrase(`Follow the letter ${l.spokenLetter}!`, `follow-the-letter-${l.id}`),
    bigAndLittle: (l) => phrase(`Find big ${l.spokenLetter} and little ${l.spokenLetter}!`, `big-and-little-${l.id}`),
    followTheLetters: phrase('Follow the letters in order!', 'follow-the-letters'),
    letsSpell: phrase("Let's spell!", 'lets-spell'),
    foundTheWay: phrase('Hooray! You found the way!', 'found-the-way'),
    wiggleAndPoint: phrase('Wiggle your fingers… and point! Whoosh!', 'wiggle-and-point'),
  },
  backgroundMusic: null,
}

/** One audio file the pack can play. `text` is null for non-speech sounds (object sounds). */
export interface AudioClip {
  kind: 'letters' | 'words' | 'objects' | 'phrases'
  /** The id that goes in `audio-manifest.json`: a letter id, or a phrase id. */
  id: string
  /** Path under /public. */
  path: string
  text: string | null
  /** What the voice model reads instead of `text`, where it would misread it (see `ENGINE_LETTER`). */
  engine?: string
}

/**
 * How the voice model (`npm run audio`) should read a letter it would otherwise misread. Kokoro
 * takes a lone "A" for the article "uh" ("Find big uh and little uh!"); "Eh" comes out as the
 * letter name. Only the generated recording changes: the id, the text on screen and the device
 * voice keep the real letter. Check with `npm run audio -- --phonemes`.
 */
const ENGINE_LETTER: Record<string, string> = { a: 'Eh' }
const forEngine = (l: AlphabetLetter): AlphabetLetter => ({ ...l, spokenLetter: ENGINE_LETTER[l.id] ?? l.spokenLetter })

/** Every clip this pack can play, recorded or not. Used by `scripts/generate-audio.mjs`. */
export function audioCatalog(): AudioClip[] {
  const clips: AudioClip[] = englishAlphabets.flatMap(l => [
    { kind: 'letters', id: l.id, path: audioPaths.letter(l.id), text: l.spokenLetter, engine: ENGINE_LETTER[l.id] },
    { kind: 'words', id: l.id, path: audioPaths.word(l.word), text: l.word },
    { kind: 'objects', id: l.id, path: audioPaths.object(l.word), text: null },
  ] satisfies AudioClip[])
  const seen = new Set<string>()
  const add = (p: SpokenPhrase, engine?: string) => {
    if (seen.has(p.id)) return
    seen.add(p.id)
    clips.push({ kind: 'phrases', id: p.id, path: audioPaths.phrase(p.id), text: p.text, engine: engine !== p.text ? engine : undefined })
  }
  for (const entry of Object.values(englishAlphabetPack.phrases)) {
    if (typeof entry === 'function') englishAlphabets.forEach(l => add(entry(l), entry(forEngine(l)).text))
    else (Array.isArray(entry) ? entry : [entry]).forEach(p => add(p))
  }
  for (const theme of TRAIL_THEMES) add(arrivalPhrase(theme))
  // Numbers & Counting shares the phrase folder (number-7.mp3, numbers-find.mp3, …).
  for (const p of numbersAudioCatalog()) clips.push({ kind: 'phrases', id: p.id, path: audioPaths.phrase(p.id), text: p.text })
  return clips
}
