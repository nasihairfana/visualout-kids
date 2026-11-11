import type { SpokenClip } from '~/types/learning'
import { sayNumber } from '~/data/english-numbers'

/**
 * Counting out loud, one thing at a time: light up thing 1 and say "one!", then thing 2…
 * Each step waits for the voice (or a short beat when sound is off), so the number heard and
 * the thing lit up always go together. Starting another count, or leaving, stops the old one.
 */
export function useCounting() {
  const { say } = useAudio()
  let token = 0
  const beat = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  /** Count `from`…`to`, calling `light(k)` as each number is said. Resolves false if interrupted. */
  async function countAloud(from: number, to: number, light: (k: number) => void, gap = 520): Promise<boolean> {
    const mine = ++token
    for (let k = from; k <= to; k++) {
      if (mine !== token) return false
      light(k)
      await Promise.all([say(sayNumber(k)), beat(gap)])
    }
    return mine === token
  }

  /** Say a list of numbers in turn (7, 8, 9 or 2, 4, 6), calling `light(i)` for each. */
  async function countList(values: number[], light: (i: number) => void, gap = 520): Promise<boolean> {
    const mine = ++token
    for (let i = 0; i < values.length; i++) {
      if (mine !== token) return false
      light(i)
      await Promise.all([say(sayNumber(values[i]!)), beat(gap)])
    }
    return mine === token
  }

  /** Say something after the count, unless something newer started. */
  async function then(clips: SpokenClip[]) {
    const mine = token
    await say(clips)
    return mine === token
  }

  const cancel = () => { token++ }
  onBeforeUnmount(cancel)
  return { countAloud, countList, then, cancel, beat }
}
