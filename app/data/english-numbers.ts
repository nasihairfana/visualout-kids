import audioManifest from './audio-manifest.json' with { type: 'json' }
import type { SpokenClip } from '../types/learning'

/**
 * Numbers & Counting: what gets said. Number words and short phrases are separate clips, so
 * "Find" + "seven" needs 2 recordings rather than one per number. Everything here is listed by
 * `numbersAudioCatalog()`, which `npm run audio` voices; until then the device voice says it.
 */
const RECORDED = new Set<string>((audioManifest as { phrases?: string[] }).phrases ?? [])
const clip = (id: string, text: string): SpokenClip => ({ src: RECORDED.has(id) ? `/audio/en/phrases/${id}.mp3` : null, text })

export const MAX_NUMBER = 30

const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
]
const TENS = ['', '', 'twenty', 'thirty']

export function numberWord(n: number): string {
  if (n <= 20) return WORDS[n]!
  const tens = TENS[Math.floor(n / 10)]!
  return n % 10 ? `${tens}-${WORDS[n % 10]}` : tens
}

/** "seven", said with a little lift so a count sounds like counting. */
export const sayNumber = (n: number) => clip(`number-${n}`, `${numberWord(n)}!`)

const PHRASES = {
  find: 'Find',
  howMany: 'How many? Count them!',
  whichMore: 'Which one has more?',
  whichLess: 'Which one has less?',
  whatComesNext: 'What number comes next?',
  whichIsMissing: 'Which number is missing?',
  countTogether: 'Let\'s count together!',
  collect: 'Collect',
  feedTheFish: 'Feed the fish',
  candles: 'Put on the candles',
  addMore: 'Now add',
  more: 'more!',
  takeAway: 'Take away',
  and: 'and',
  makes: 'makes',
  takeAwayLeaves: 'leaves',
  thatsMore: 'That one has more!',
  thatsLess: 'That one has less!',
  inOrder: 'Put the numbers in order!',
  countBack: 'Count backwards!',
  countByTwos: 'Count in twos!',
  jump: 'Help the frog jump across!',
  matchThem: 'Match the number to the group!',
  parkThem: 'Park each car in its space!',
  flyTo: 'Fly to planet',
  catchFish: 'Catch the fish with',
  popBalloon: 'Pop the balloon with',
  thats: 'That\'s',
  wellDone: 'Well done!',
  yay: 'Yay!',
  greatCounting: 'Great counting!',
  allAboard: 'All aboard! Choo choo!',
  yum: 'Yum!',
  happyBirthday: 'Happy birthday!',
} as const
export type NumbersPhrase = keyof typeof PHRASES

const slug = (key: string) => key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
export const sayPhrase = (key: NumbersPhrase) => clip(`numbers-${slug(key)}`, PHRASES[key])

/** Every clip for `npm run audio` (number words 0–30 and the phrases). */
export function numbersAudioCatalog() {
  return [
    ...Array.from({ length: MAX_NUMBER + 1 }, (_, n) => ({ id: `number-${n}`, text: `${numberWord(n)}!` })),
    ...Object.entries(PHRASES).map(([key, text]) => ({ id: `numbers-${slug(key)}`, text })),
  ]
}
