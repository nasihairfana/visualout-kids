/**
 * Numbers & Counting rounds. Pure functions: a difficulty, how many sessions the child has already
 * finished at it (`step`, so it creeps up gently) and the round number inside a session (0–4).
 *
 *   Beginner        1–5: recognise, count small groups, match number and quantity
 *   Challenge       1–10: order, missing numbers, bigger groups, more and less
 *   Super Challenge 1–20 (then up to 30): adding, taking away, tens and ones, counting back and in twos
 */
export type Difficulty = 'beginner' | 'challenge' | 'super'
export const DIFFICULTIES: Difficulty[] = ['beginner', 'challenge', 'super']
export const ROUNDS_PER_SESSION = 5

export type Random = () => number
const int = (rand: Random, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))
export function shuffle<T>(list: T[], rand: Random): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** `count` distinct numbers in [lo, hi] including `answer`, close to it (the useful mix-ups). */
function choicesAround(answer: number, count: number, lo: number, hi: number, rand: Random): number[] {
  const pool = new Set([answer])
  for (let spread = 1; pool.size < count && spread < 40; spread++) {
    for (const n of shuffle([answer - spread, answer + spread], rand)) {
      if (pool.size < count && n >= lo && n <= hi) pool.add(n)
    }
  }
  return shuffle([...pool], rand)
}

// ---- collect: into the basket / fish / cake ---------------------------------------------------------

export type CollectRound =
  | { kind: 'collect', target: number, pile: number }
  /** `start` are already in; add `add` more. 2 + 3 = 5, shown with two colours. */
  | { kind: 'add', start: number, add: number, pile: number }
  /** `start` are in; take `remove` out, then count what's left. */
  | { kind: 'takeAway', start: number, remove: number }

export function collectRound(d: Difficulty, step: number, i: number, rand: Random = Math.random): CollectRound {
  if (d === 'beginner') {
    const hi = step === 0 ? (i < 2 ? 3 : 4) : 5
    const target = int(rand, i === 0 ? 1 : 2, hi)
    return { kind: 'collect', target, pile: target + 2 }
  }
  if (d === 'challenge') {
    if (i === 4 && step >= 1) {
      const start = int(rand, 1, 4)
      return { kind: 'add', start, add: int(rand, 1, 5 - start + 1), pile: 6 }
    }
    const target = int(rand, step === 0 ? 4 : 5, step === 0 ? 7 : 10)
    return { kind: 'collect', target, pile: Math.min(13, target + 3) }
  }
  const top = step < 2 ? 10 : 15
  if (i === 0) {
    const target = int(rand, 8, top === 10 ? 12 : 15)
    return { kind: 'collect', target, pile: target + 3 }
  }
  if (i % 2 === 1) {
    const start = int(rand, 2, top - 4)
    const add = int(rand, 1, Math.min(5, top - start))
    return { kind: 'add', start, add, pile: add + 3 }
  }
  const start = int(rand, 5, top)
  return { kind: 'takeAway', start, remove: int(rand, 1, Math.min(5, start - 1)) }
}

// ---- find: balloons, fish, planets ------------------------------------------------------------------

export type FindPrompt =
  | { kind: 'find', n: number }
  /** Count the group (tap each one to count it), then find its number. */
  | { kind: 'howMany', n: number, tens: boolean }
  /** Two groups to compare; the choices carry the groups, not numbers. */
  | { kind: 'more' | 'less', a: number, b: number }
  | { kind: 'add', a: number, b: number }
  | { kind: 'sub', a: number, b: number }
  /** A run of numbers with one gap (null); find the missing one. */
  | { kind: 'missing', run: Array<number | null> }

export interface FindRound {
  prompt: FindPrompt
  answer: number
  /** Numbers on the balloons. For more/less: the size of each group. */
  choices: number[]
}

export function findRound(d: Difficulty, step: number, i: number, rand: Random = Math.random): FindRound {
  if (d === 'beginner') {
    const hi = step === 0 ? 4 : 5
    const count = step < 2 ? 3 : 4
    const n = int(rand, 1, hi)
    const prompt: FindPrompt = i >= 3 && step >= 1 ? { kind: 'howMany', n, tens: false } : { kind: 'find', n }
    return { prompt, answer: n, choices: choicesAround(n, count, 1, 5, rand) }
  }
  if (d === 'challenge') {
    const kinds = ['find', 'howMany', 'more', 'missing', step >= 1 ? 'less' : 'find'] as const
    const kind = kinds[i % kinds.length]!
    if (kind === 'more' || kind === 'less') {
      const gap = step === 0 ? int(rand, 2, 4) : int(rand, 1, 3)
      const small = int(rand, 1, 10 - gap)
      const [a, b] = shuffle([small, small + gap], rand) as [number, number]
      return { prompt: { kind, a, b }, answer: kind === 'more' ? Math.max(a, b) : Math.min(a, b), choices: [a, b] }
    }
    if (kind === 'missing') {
      const start = int(rand, 1, 6)
      const run: Array<number | null> = [start, start + 1, start + 2, start + 3, start + 4]
      const gap = int(rand, 1, 3)
      const answer = run[gap]!
      run[gap] = null
      return { prompt: { kind: 'missing', run }, answer, choices: choicesAround(answer, 4, 1, 10, rand) }
    }
    const n = int(rand, kind === 'find' ? 5 : 3, 10)
    return { prompt: kind === 'find' ? { kind, n } : { kind, n, tens: false }, answer: n, choices: choicesAround(n, 4, 1, 10, rand) }
  }
  const top = step < 2 ? 10 : 20
  const kinds = ['find', 'add', 'howMany', 'sub', 'missing'] as const
  const kind = kinds[i % kinds.length]!
  if (kind === 'add') {
    const a = int(rand, 1, top - 2)
    const b = int(rand, 1, Math.min(top === 10 ? 5 : 9, top - a))
    return { prompt: { kind, a, b }, answer: a + b, choices: choicesAround(a + b, 4, 1, top, rand) }
  }
  if (kind === 'sub') {
    const a = int(rand, 3, top)
    const b = int(rand, 1, Math.min(top === 10 ? 4 : 8, a - 1))
    return { prompt: { kind, a, b }, answer: a - b, choices: choicesAround(a - b, 4, 0, top, rand) }
  }
  if (kind === 'howMany') {
    // Ten and some more: one full ten-frame and a few, so 13 is "10 and 3".
    const n = int(rand, 11, step < 2 ? 15 : 20)
    return { prompt: { kind, n, tens: true }, answer: n, choices: choicesAround(n, 4, 10, 20, rand) }
  }
  const hi = step < 3 ? 20 : 30
  if (kind === 'missing') {
    const by = step >= 1 && rand() < 0.4 ? 2 : 1
    const start = int(rand, 10, hi - 4 * by)
    const run: Array<number | null> = Array.from({ length: 5 }, (_, k) => start + k * by)
    const gap = int(rand, 1, 4)
    const answer = run[gap]!
    run[gap] = null
    return { prompt: { kind, run }, answer, choices: choicesAround(answer, 4, 1, hi, rand) }
  }
  const n = int(rand, 11, hi)
  return { prompt: { kind: 'find', n }, answer: n, choices: choicesAround(n, 4, 10, hi, rand) }
}

// ---- sequence: train carriages, lily pads -------------------------------------------------------------

export interface SequenceRound {
  kind: 'up' | 'down' | 'twos' | 'missing'
  /** The numbers in their places, left to right (or the order the frog jumps). */
  values: number[]
  /** Already in place at the start. For runs this is the first one, so the child sees where to begin. */
  given: boolean[]
  /** Numbers to choose from that don't belong (a few, so it isn't just "the last card left"). */
  extras: number[]
}

function run(start: number, length: number, by: number) {
  return Array.from({ length }, (_, k) => start + k * by)
}

export function sequenceRound(d: Difficulty, step: number, i: number, rand: Random = Math.random, allowMissing = true): SequenceRound {
  const extrasFor = (values: number[], count: number, lo: number, hi: number) => {
    const out = new Set<number>()
    for (let tries = 0; out.size < count && tries < 60; tries++) {
      const n = int(rand, lo, hi)
      if (!values.includes(n)) out.add(n)
    }
    return [...out]
  }
  if (d === 'beginner') {
    const length = step === 0 ? (i < 2 ? 3 : 4) : i < 1 ? 4 : 5
    const values = run(1, length, 1)
    return { kind: 'up', values, given: values.map(() => false), extras: step >= 1 ? extrasFor(values, 1, 1, 6) : [] }
  }
  if (d === 'challenge') {
    if (allowMissing && i % 2 === 1) {
      const length = step === 0 ? 6 : int(rand, 7, 10)
      const values = run(int(rand, 1, 11 - length), length, 1)
      const gaps = new Set(shuffle(values.slice(1).map((_, k) => k + 1), rand).slice(0, step === 0 ? 2 : 3))
      return { kind: 'missing', values, given: values.map((_, k) => !gaps.has(k)), extras: extrasFor(values, 2, 1, 10) }
    }
    if (step >= 2 && i === 4) {
      const values = run(int(rand, 5, 10), 5, -1)
      return { kind: 'down', values, given: values.map((_, k) => k === 0), extras: extrasFor(values, 2, 1, 10) }
    }
    const values = run(int(rand, 1, 6), 5, 1)
    return { kind: 'up', values, given: values.map((_, k) => k === 0 && values[0] !== 1), extras: extrasFor(values, 2, 1, 10) }
  }
  const hi = step < 3 ? 20 : 30
  const kinds = (['up', 'twos', allowMissing ? 'missing' : 'down', 'down', 'up'] as const)
  const kind = kinds[i % kinds.length]!
  if (kind === 'twos') {
    const values = run(2 * int(rand, 1, Math.floor((hi - 8) / 2)), 5, 2)
    return { kind, values, given: values.map((_, k) => k < 2), extras: extrasFor(values, 3, values[0]!, values[4]!) }
  }
  if (kind === 'down') {
    const values = run(int(rand, 8, hi), 5, -1)
    return { kind, values, given: values.map((_, k) => k === 0), extras: extrasFor(values, 2, values[4]! - 2, values[0]! + 2) }
  }
  if (kind === 'missing') {
    const values = run(int(rand, 8, hi - 5), 6, 1)
    const gaps = new Set(shuffle([1, 2, 3, 4, 5], rand).slice(0, 3))
    return { kind, values, given: values.map((_, k) => !gaps.has(k)), extras: extrasFor(values, 2, values[0]! - 2, values[5]! + 2) }
  }
  const values = run(int(rand, 9, hi - 4), 5, 1)
  return { kind: 'up', values, given: values.map((_, k) => k === 0), extras: extrasFor(values, 2, values[0]! - 2, values[4]! + 2) }
}

// ---- match: numbers to groups ---------------------------------------------------------------------

export interface MatchGroup {
  n: number
  /** How the quantity is drawn: things, a ten-frame (10 and some more), or two colours (a + b). */
  show: 'things' | 'tens' | 'sum'
  a?: number
  b?: number
}
export interface MatchRound { groups: MatchGroup[] }

export function matchRound(d: Difficulty, step: number, i: number, rand: Random = Math.random): MatchRound {
  const distinct = (count: number, lo: number, hi: number) => shuffle(run(lo, hi - lo + 1, 1), rand).slice(0, count)
  if (d === 'beginner') {
    const ns = distinct(3, 1, step === 0 && i < 2 ? 4 : 5)
    return { groups: ns.map(n => ({ n, show: 'things' })) }
  }
  if (d === 'challenge') {
    const ns = distinct(4, step === 0 ? 2 : 3, step === 0 ? 8 : 10)
    return { groups: ns.map(n => ({ n, show: 'things' })) }
  }
  const top = step < 2 ? 12 : 20
  const ns = distinct(4, 5, top)
  return {
    groups: ns.map((n, k) => {
      if (n > 10 && k % 2 === 0) return { n, show: 'tens' }
      const a = int(rand, 1, n - 1)
      return k % 2 === 1 || n > 10 ? { n, show: 'sum', a, b: n - a } : { n, show: 'things' }
    }),
  }
}
