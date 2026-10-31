import type { AlphabetLetter, AlphabetPack, CardTheme, LetterAssets, SpokenPhrase } from '~/types/learning'

/**
 * English A–Z content for "My First ABC".
 *
 * ASSET STATUS (keep in sync with ASSETS.md):
 * - Illustrations: PLACEHOLDERS. Simple SVGs in /public/illustrations stand in until the
 *   original Visualout Kids artwork is ready. Replace a file in place and add its id to
 *   `FINAL_ART` below.
 * - Audio: NOT YET RECORDED. All audio paths are `null`; the audio service falls back to
 *   the device's on-device voice (if allowed in Parent settings) or stays silent.
 *
 * To add a real asset: drop the file into /public at the path listed in ASSETS.md and
 * set the matching field below (or in `RECORDED` / `ILLUSTRATED`).
 */

/** Letters whose human recordings exist in /public/audio/en. Add ids as files arrive. */
const RECORDED = {
  letters: new Set<string>([]),
  words: new Set<string>([]),
  objects: new Set<string>([]),
  /** Phrase file names (without .mp3), e.g. 'wonderful', 'where-is-a'. */
  phrases: new Set<string>([]),
}

/** Letters whose /public/illustrations file is final artwork rather than a placeholder. */
const FINAL_ART = new Set<string>([])

const THEMES: CardTheme[] = ['peach', 'mint', 'sky', 'lilac', 'butter', 'rose']

const slug = (word: string) => word.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')

function assetsFor(id: string, word: string): LetterAssets {
  return {
    illustration: `/illustrations/${slug(word)}.svg`,
    illustrationIsPlaceholder: !FINAL_ART.has(id),
    letterAudio: RECORDED.letters.has(id) ? `/audio/en/letters/${id}.mp3` : null,
    wordAudio: RECORDED.words.has(id) ? `/audio/en/words/${slug(word)}.mp3` : null,
    objectSound: RECORDED.objects.has(id) ? `/audio/en/objects/${slug(word)}.mp3` : null,
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

const phrase = (text: string, file: string): SpokenPhrase => ({
  text,
  audio: RECORDED.phrases.has(file) ? `/audio/en/phrases/${file}.mp3` : null,
})

export const englishAlphabetPack: AlphabetPack = {
  lang: 'en',
  letters: englishAlphabets,
  phrases: {
    whereIs: (l) => phrase(`Where is ${l.spokenLetter}?`, `where-is-${l.id}`),
    whichStartsWith: (l) => phrase(`${l.spokenLetter}. Which one starts with ${l.spokenLetter}?`, `which-starts-with-${l.id}`),
    letterIsFor: (l) => phrase(`${l.spokenLetter} is for ${l.word}!`, `${l.id}-is-for`),
    praise: [phrase('Wonderful!', 'wonderful'), phrase('Yay! Well done!', 'well-done'), phrase('You found it!', 'you-found-it')],
    tryAgain: [phrase("Let's try again!", 'try-again'), phrase('Almost! Try another one.', 'almost')],
    greatExploring: phrase('Great exploring!', 'great-exploring'),
    greatFinding: phrase('Great finding!', 'great-finding'),
    greatMatching: phrase('Great matching!', 'great-matching'),
  },
  backgroundMusic: null,
}
