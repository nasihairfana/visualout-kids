import audioManifest from './audio-manifest.json' with { type: 'json' }
import type { SpokenClip } from '../types/learning'

/**
 * Numbers & Counting: what gets said.
 *
 * A line is never pieced together from single words: a word voiced on its own ("and", "makes",
 * "Pop the balloon with") gets its own falling, sentence-final tune and sounds robotic when
 * joined to the next one. So:
 * - lines with one number are whole sentences, one recording per number ("Pop the balloon with
 *   seven!", "That's seven.");
 * - sums are two or three short phrases, each with its number in it ("Three," "and two."
 *   "That makes five!"), so no small word is ever said by itself.
 *
 * Everything here is listed by `numbersAudioCatalog()`, which `npm run audio` voices, and
 * `npm run check:audio` fails the build if any of it has no recording.
 */
const RECORDED = new Set<string>((audioManifest as { phrases?: string[] }).phrases ?? [])
const clip = (id: string, text: string): SpokenClip => ({ src: RECORDED.has(id) ? `/audio/en/phrases/${id}.mp3` : null, text })

/** The highest number any game shows or says. */
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
const capital = (s: string) => s[0]!.toUpperCase() + s.slice(1)

/** A family of clips with one number in them, e.g. `numbers-thats-7` "That's seven.". */
interface NumberLine {
  /** Clip id for `n`. */
  id: (n: number) => string
  text: (n: number) => string
  /** The numbers that have a recording. Wide enough for every round `rounds.ts` can make. */
  from: number
  to: number
}
const line = (prefix: string, from: number, to: number, text: (word: string, n: number) => string): NumberLine =>
  ({ id: n => `${prefix}-${n}`, text: n => text(numberWord(n), n), from, to })

const has = (l: NumberLine, n: number) => Number.isInteger(n) && n >= l.from && n <= l.to
const sayLine = (l: NumberLine, n: number) => clip(l.id(n), l.text(n))

/** Counting out loud: "seven!", with a little lift. Also said when a number is tapped. */
const COUNTING = line('number', 0, MAX_NUMBER, w => `${w}!`)

/**
 * The parts of adding and taking away. Ranges come from `rounds.ts`: Find adds up to 9 and takes away up to 8 from as many
 * as 20; Collect adds and takes away up to 5, with sums up to 15 (see CollectEngine's `makeRound`).
 */
const SUM = {
  /** "Three," the first number of a sum: plain, without the counting lift. */
  first: line('number-plain', 1, 20, w => `${capital(w)},`),
  /** Find: "Three," "and two." "How many? Count them!" */
  and: line('numbers-and', 1, 9, w => `and ${w}.`),
  /** Collect: "Three," "now add two more!" */
  addMore: line('numbers-add-more', 1, 5, w => `now add ${w} more!`),
  /** "Five," "take away two." */
  takeAway: line('numbers-take-away', 1, 8, w => `take away ${w}.`),
  /** After adding: "That makes five!" */
  makes: line('numbers-makes', 2, 15, w => `That makes ${w}!`),
  /** After taking away: "That leaves three!" */
  leaves: line('numbers-leaves', 1, 14, w => `That leaves ${w}!`),
}

/** "That's seven." Calm, not cheered: it is said when the child picks the wrong number. */
const THATS = line('numbers-thats', 0, MAX_NUMBER, w => `That's ${w}.`)

/**
 * The instruction of each collect and find game, as one sentence with its number.
 * Find games go up to 30, the basket up to 15, and the fish and the cake up to 10
 * (see `findRound`, `collectRound` and CollectEngine's `makeRound`).
 */
const ASKS = {
  collect: line('numbers-collect', 1, 15, w => `Collect ${w}!`),
  feedTheFish: line('numbers-feed-the-fish', 1, 10, w => `Feed the fish ${w}!`),
  candles: line('numbers-candles', 1, 10, (w, n) => `Put ${w} ${n === 1 ? 'candle' : 'candles'} on the cake!`),
  popBalloon: line('numbers-pop-balloon', 1, MAX_NUMBER, w => `Pop the balloon with ${w}!`),
  catchFish: line('numbers-catch-fish', 1, MAX_NUMBER, w => `Catch the fish with ${w}!`),
  flyTo: line('numbers-fly-to', 1, MAX_NUMBER, w => `Fly to planet ${w}!`),
} satisfies Record<string, NumberLine>
export type NumberAsk = keyof typeof ASKS

/** Whole sentences that need no number. */
const PHRASES = {
  howMany: 'How many? Count them!',
  whichMore: 'Which one has more?',
  whichLess: 'Which one has less?',
  whatComesNext: 'What number comes next?',
  whichIsMissing: 'Which number is missing?',
  countTogether: 'Let\'s count together!',
  thatsMore: 'That one has more!',
  thatsLess: 'That one has less!',
  inOrder: 'Put the numbers in order!',
  countBack: 'Count backwards!',
  countByTwos: 'Count in twos!',
  jump: 'Help the frog jump across!',
  matchThem: 'Match the number to the group!',
  parkThem: 'Park each car in its space!',
  wellDone: 'Well done!',
  yay: 'Yay!',
  greatCounting: 'Great counting!',
  allAboard: 'All aboard! Choo choo!',
  yum: 'Yum!',
  happyBirthday: 'Happy birthday!',
  // Number Train Adventure
  numberValley: 'Welcome to Number Valley! Put the numbers in order.',
  missingBridge: 'Missing Number Bridge! Which number is missing?',
  animalStation: 'Animal Station! How many passengers are on the train?',
  partyStation: 'Hooray! We made it to Party Station!',
  greatJob: 'Great job!',
  nextStop: 'Next stop!',
} as const
export type NumbersPhrase = keyof typeof PHRASES

/** What a game asks: a sentence with a number (collect and find games) or one without. */
export type GameAsk = NumberAsk | NumbersPhrase

const slug = (key: string) => key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
export const sayPhrase = (key: NumbersPhrase) => clip(`numbers-${slug(key)}`, PHRASES[key])

/** "seven!", as when counting out loud. */
export const sayNumber = (n: number) => sayLine(COUNTING, n)

// Each builder below falls back to the counting form for a number outside its recorded range,
// so a line is never silent. `npm run check:audio` makes sure no round ever needs the fallback.

/** A first number in a sum ("Three,"). */
const first = (n: number) => (has(SUM.first, n) ? sayLine(SUM.first, n) : sayNumber(n))
const part = (l: NumberLine, n: number) => (has(l, n) ? [sayLine(l, n)] : [sayNumber(n)])

/** A game's instruction. "Collect seven!" for the collect and find games, "Help the frog jump across!" for the rest. */
export function sayAsk(ask: GameAsk, n?: number): SpokenClip[] {
  if (ask in ASKS) {
    const l = ASKS[ask as NumberAsk]
    if (n === undefined) return []
    return has(l, n) ? [sayLine(l, n)] : [sayNumber(n)]
  }
  return [sayPhrase(ask as NumbersPhrase)]
}

/** "That's seven." After a wrong pick. */
export const sayThats = (n: number) => part(THATS, n)

/** Find, adding: "Three, and two. How many? Count them!" */
export const sayAddQuestion = (a: number, b: number) => [first(a), ...part(SUM.and, b), sayPhrase('howMany')]
/** Find, taking away: "Five, take away two. How many? Count them!" */
export const sayTakeAwayQuestion = (a: number, b: number) => [first(a), ...part(SUM.takeAway, b), sayPhrase('howMany')]
/** Collect, adding: "Three, now add two more!" */
export const sayAddMore = (start: number, add: number) => [first(start), ...part(SUM.addMore, add)]
/** Collect, taking away: "Five, take away two." */
export const sayTakeAway = (start: number, remove: number) => [first(start), ...part(SUM.takeAway, remove)]
/** "Three, and two. That makes five!" */
export const saySum = (a: number, b: number) => [first(a), ...part(SUM.and, b), ...part(SUM.makes, a + b)]
/** "Five, take away two. That leaves three!" */
export const sayDifference = (a: number, b: number) => [first(a), ...part(SUM.takeAway, b), ...part(SUM.leaves, a - b)]

/** Every clip for `npm run audio`. */
export function numbersAudioCatalog(): Array<{ id: string, text: string }> {
  const all = (l: NumberLine) => Array.from({ length: l.to - l.from + 1 }, (_, k) => ({ id: l.id(l.from + k), text: l.text(l.from + k) }))
  return [
    ...all(COUNTING),
    ...Object.values(SUM).flatMap(all),
    ...all(THATS),
    ...Object.values(ASKS).flatMap(all),
    ...Object.entries(PHRASES).map(([key, text]) => ({ id: `numbers-${slug(key)}`, text })),
  ]
}
