/**
 * Letter Trails: builds each level's map. A level is a grid of letter tiles with one trail from
 * the start (where the animal stands) to the goal (its carrot, nest, mother…). Every tile on the
 * trail holds the letter to follow; no tile off the trail ever does, so there's exactly one way
 * through and no dead ends to get stuck in.
 *
 * The trail never touches itself (no two non-consecutive trail tiles are side by side), so the
 * next step is never ambiguous. Levels are seeded: replaying a level gives the same map.
 */
import type { AlphabetLetter } from '~/types/learning'

export type Difficulty = 'beginner' | 'challenge' | 'super'
export const DIFFICULTIES: Difficulty[] = ['beginner', 'challenge', 'super']

export interface Cell { r: number, c: number }

export interface TrailTile extends Cell {
  /** What's printed on the tile, e.g. "E" or "e". */
  text: string
  letterId: string
  /** Position on the trail (1 = first step after the start), or null for an off-trail tile. */
  step: number | null
}

export type TrailMode =
  /** One letter, all the same case: follow the "e"s. */
  | 'letter'
  /** One letter in both cases: follow "A" and "a". */
  | 'mixed'
  /** Letters in alphabet order: A, B, C, D… */
  | 'sequence'
  /** Spell a word along the trail: C, A, T, C, A, T. */
  | 'word'

export interface TrailLevel {
  rows: number
  cols: number
  /** Start, every step, then the goal. */
  path: Cell[]
  /** Every cell except the start and the goal. */
  tiles: TrailTile[]
  mode: TrailMode
  /** The letters to follow, in order (one letter for 'letter' and 'mixed'). */
  sequence: AlphabetLetter[]
  /** 'upper' or 'lower' for the target in 'letter' mode; 'mixed' otherwise. */
  letterCase: 'upper' | 'lower' | 'mixed'
  /** For 'word' mode: the word's own letter (its picture and recording), e.g. C for Cat. */
  word: AlphabetLetter | null
}

/** Small, fast, seeded random numbers, so a level is the same every time it's played. */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Random = () => number
const pickFrom = <T>(list: readonly T[], rand: Random) => list[Math.floor(rand() * list.length)]!
function shuffled<T>(list: readonly T[], rand: Random) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

interface Params {
  rows: number
  cols: number
  minLen: number
  maxLen: number
  mode: TrailMode
  /** How many different letters the off-trail tiles use. */
  distractors: number
}

/**
 * How hard a level is. `ramp` counts the levels this child has already finished at this
 * difficulty, so the maps grow gently as they go, never faster than they play.
 * Path lengths count the start and the goal.
 */
function paramsFor(difficulty: Difficulty, ramp: number): Params {
  if (difficulty === 'beginner') {
    return {
      rows: 3,
      cols: ramp >= 4 ? 5 : 4,
      minLen: 4 + Math.min(1, Math.floor(ramp / 2)),
      maxLen: 5 + Math.min(2, Math.floor(ramp / 2)),
      mode: 'letter',
      distractors: 1 + Math.min(2, Math.floor(ramp / 2)),
    }
  }
  if (difficulty === 'challenge') {
    return {
      rows: 4,
      cols: ramp >= 3 ? 6 : 5,
      minLen: 6 + Math.min(2, Math.floor(ramp / 2)),
      maxLen: 8 + Math.min(2, Math.floor(ramp / 2)),
      mode: ramp >= 1 ? 'mixed' : 'letter',
      distractors: 4 + Math.min(3, Math.floor(ramp / 2)),
    }
  }
  return {
    rows: 4,
    cols: 6,
    minLen: 6,
    maxLen: 9,
    mode: ramp >= 3 ? 'word' : 'sequence',
    distractors: 5,
  }
}

const neighbours = ({ r, c }: Cell): Cell[] => [{ r: r - 1, c }, { r: r + 1, c }, { r, c: c - 1 }, { r, c: c + 1 }]
const same = (a: Cell, b: Cell) => a.r === b.r && a.c === b.c
const touching = (a: Cell, b: Cell) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1

/**
 * A trail from the left edge to the right edge that never touches itself, `steps` cells long
 * (including start and goal), or null if none was found this time.
 */
function findPath(rows: number, cols: number, length: number, rand: Random): Cell[] | null {
  let budget = 4000
  const path: Cell[] = [{ r: Math.floor(rand() * rows), c: 0 }]
  const walk = (): boolean => {
    if (--budget < 0) return false
    const here = path[path.length - 1]!
    if (path.length === length) return here.c === cols - 1
    for (const next of shuffled(neighbours(here), rand)) {
      if (next.r < 0 || next.r >= rows || next.c < 0 || next.c >= cols) continue
      if (path.some(p => same(p, next))) continue
      // Never brush against an earlier part of the trail.
      if (path.slice(0, -1).some(p => touching(p, next))) continue
      // The far edge is only for the goal.
      const isLast = path.length + 1 === length
      if ((next.c === cols - 1) !== isLast) continue
      path.push(next)
      if (walk()) return true
      path.pop()
    }
    return false
  }
  return walk() ? path : null
}

/** Simple words whose first letter's picture and recording we already have. */
const WORDS = { short: ['c', 'd', 's', 'v'], long: ['b', 'f', 'g', 'k', 'l', 'n'] }

export function buildLevel(letters: AlphabetLetter[], difficulty: Difficulty, level: number, ramp: number, seedExtra = ''): TrailLevel {
  const rand = seeded(`${difficulty}:${level}:${ramp}:${seedExtra}`)
  const p = paramsFor(difficulty, ramp)
  const byId = (id: string) => letters.find(l => l.id === id)!

  // What to follow.
  let sequence: AlphabetLetter[]
  let word: AlphabetLetter | null = null
  if (p.mode === 'sequence') {
    const run = 4 + Math.min(2, ramp)
    const start = Math.floor(rand() * (letters.length - run))
    sequence = letters.slice(start, start + run)
  }
  else if (p.mode === 'word') {
    word = byId(pickFrom(ramp >= 6 ? WORDS.long : WORDS.short, rand))
    sequence = [...word.word.toLowerCase()].map(byId)
  }
  else {
    sequence = [pickFrom(letters, rand)]
  }
  const letterCase: TrailLevel['letterCase'] = p.mode === 'letter' ? (level % 2 === 1 ? 'upper' : 'lower') : 'mixed'

  // The trail: as long as the level allows, so every step of a word or sequence fits.
  const wanted = p.mode === 'word' || p.mode === 'sequence' ? Math.max(p.minLen, sequence.length + 2) : p.minLen
  let path: Cell[] | null = null
  for (let length = Math.min(p.maxLen, wanted + Math.floor(rand() * (p.maxLen - wanted + 1))); !path && length >= 4; length--) {
    for (let attempt = 0; attempt < 12 && !path; attempt++) path = findPath(p.rows, p.cols, length, rand)
  }
  path ??= Array.from({ length: p.cols }, (_, c) => ({ r: 0, c }))

  // Off-trail letters: never one that's being followed, in either case.
  const following = new Set(sequence.map(l => l.id))
  const pool = shuffled(letters.filter(l => !following.has(l.id)), rand).slice(0, p.distractors)
  const textOf = (l: AlphabetLetter, forTarget: boolean) => {
    if (letterCase === 'upper' && (forTarget || p.mode === 'letter')) return l.uppercase
    if (letterCase === 'lower' && (forTarget || p.mode === 'letter')) return l.lowercase
    if (p.mode === 'sequence' || p.mode === 'word') return l.uppercase
    return rand() < 0.5 ? l.uppercase : l.lowercase
  }

  const tiles: TrailTile[] = []
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      const index = path.findIndex(cell => cell.r === r && cell.c === c)
      if (index === 0 || index === path.length - 1) continue
      if (index > 0) {
        const letter = sequence[(index - 1) % sequence.length]!
        tiles.push({ r, c, text: textOf(letter, true), letterId: letter.id, step: index })
      }
      else {
        const letter = pickFrom(pool, rand)
        tiles.push({ r, c, text: textOf(letter, false), letterId: letter.id, step: null })
      }
    }
  }
  return { rows: p.rows, cols: p.cols, path, tiles, mode: p.mode, sequence, letterCase, word }
}
