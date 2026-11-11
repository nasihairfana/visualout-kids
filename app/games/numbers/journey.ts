import type { Difficulty, Random } from './rounds'

/**
 * Number Train Adventure: what happens at each station of one journey.
 *
 *   Number Valley          put five numbers in order (Beginner: 1 to 5)
 *   Missing Number Bridge  one number is missing from five; three numbers to choose from
 *   Animal Station         count the passengers and bring their number
 *
 * Beginner sticks to 1–5. Challenge runs within 1–10 and carries up to 8 passengers; Super
 * Challenge runs within 1–20 and up to 10 passengers (two to a carriage).
 */
export type PassengerKind = 'rabbit' | 'bear' | 'duck' | 'cat'
export const PASSENGER_KINDS: PassengerKind[] = ['rabbit', 'bear', 'duck', 'cat']
export const CARRIAGES = 5

/** What one carriage of the Number Train shows. */
export interface TrainCar {
  /** A number, '?' for the empty slot, or null (passengers instead). */
  text: string | null
  state: 'empty' | 'filled' | 'given' | 'passengers'
  lit?: boolean
  glow?: boolean
  passengers?: Array<{ kind: PassengerKind, count: number | null, lit: boolean }>
}

export interface JourneyPlan {
  order: number[]
  missing: { values: number[], gap: number, choices: number[] }
  passengers: { count: number, seats: PassengerKind[][], choices: number[] }
}

const int = (rand: Random, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))
function shuffle<T>(list: T[], rand: Random): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}
const run = (start: number) => Array.from({ length: CARRIAGES }, (_, k) => start + k)

export function planJourney(d: Difficulty, rand: Random = Math.random): JourneyPlan {
  const top = d === 'beginner' ? 5 : d === 'challenge' ? 10 : 20
  const startOf = () => (d === 'beginner' ? 1 : int(rand, d === 'challenge' ? 1 : 8, top - CARRIAGES + 1))

  const order = run(startOf())

  const values = run(startOf())
  const gap = int(rand, 0, CARRIAGES - 1)
  const answer = values[gap]!
  const others = shuffle([-2, -1, 1, 2].map(o => answer + o).filter(n => n >= 1 && n <= Math.max(top, 5)), rand)
  const missing = { values, gap, choices: shuffle([answer, ...others.slice(0, 2)], rand) }

  const count = d === 'beginner' ? int(rand, 1, 5) : d === 'challenge' ? int(rand, 3, 8) : int(rand, 5, 10)
  const perCar = count > CARRIAGES ? 2 : 1
  const places = shuffle(Array.from({ length: CARRIAGES * perCar }, (_, i) => i), rand).slice(0, count)
  // A mix of animals: every kind turns up before any repeats.
  const kinds = shuffle(PASSENGER_KINDS, rand)
  const seats: PassengerKind[][] = Array.from({ length: CARRIAGES }, () => [])
  places.sort((a, b) => a - b).forEach((place, i) => seats[Math.floor(place / perCar)]!.push(kinds[i % kinds.length]!))
  const lo = d === 'beginner' ? 1 : Math.min(Math.max(1, count - int(rand, 0, 4)), 10 - CARRIAGES + 1)
  const choices = shuffle(run(lo), rand)
  return { order, missing, passengers: { count, seats, choices } }
}
