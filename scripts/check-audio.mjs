/**
 * Fails when something the app says has no recording, so a child never hears the robotic device
 * voice for a line that was simply never voiced. Runs before every `npm run generate`.
 *
 *   npm run check:audio
 *
 * It checks that:
 * 1. every speech clip in `audioCatalog()` is in `audio-manifest.json` and on disk;
 * 2. no component builds its own text-only clip (`{ src: null, text: … }`), which no recording
 *    could ever replace: add a phrase to the pack instead;
 * 3. every number a Numbers round can produce is said by a recorded sentence. The round
 *    generators are sampled across difficulties, steps and many seeds, and each line is built
 *    with the same functions the games use.
 *
 * Fix a failure with `npm run audio`, which voices whatever is missing.
 * Needs Node 22.18+ (it imports the TypeScript data directly, as `generate-audio.mjs` does).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

if (!process.features.typescript) {
  console.warn(`check:audio skipped: Node ${process.version} can't read TypeScript (needs 22.18+).`)
  process.exit(0)
}

const { audioCatalog } = await import('../app/data/english-alphabets.ts')
const N = await import('../app/data/english-numbers.ts')
const { NUMBER_GAMES } = await import('../app/data/number-games.ts')
const R = await import('../app/games/numbers/rounds.ts')
const { planJourney } = await import('../app/games/numbers/journey.ts')

const failures = []

// ---- 1. every clip is recorded ---------------------------------------------------------------------

const manifest = JSON.parse(readFileSync('app/data/audio-manifest.json', 'utf8'))
const listed = new Set(['letters', 'words', 'phrases'].flatMap(kind => manifest[kind].map(id => `${kind}/${id}`)))
const speech = audioCatalog().filter(c => c.text)
const missing = speech.filter(c => !listed.has(`${c.kind}/${c.id}`) || !existsSync(join('public', c.path)))
if (missing.length) {
  failures.push(`${missing.length} of ${speech.length} speech clips have no recording:\n${missing.slice(0, 15).map(c => `  ${c.path}  "${c.text}"`).join('\n')}${missing.length > 15 ? `\n  … and ${missing.length - 15} more` : ''}`)
}

// ---- 2. no text-only clips built in components ----------------------------------------------------------

const sources = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? sources(path) : /\.(vue|ts)$/.test(name) ? [path] : []
})
for (const file of sources('app')) {
  readFileSync(file, 'utf8').split('\n').forEach((text, k) => {
    if (/src:\s*null\s*,\s*text:/.test(text)) failures.push(`${file}:${k + 1} builds a text-only clip that can never be recorded. Add it as a phrase in english-alphabets.ts or english-numbers.ts.`)
  })
}

// ---- 3. Numbers: every round's lines are whole recorded sentences ---------------------------------------

/** Small seeded generator, so a failure can be reproduced. */
const seeded = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const outOfRange = new Map()
const unrecorded = new Set()
const used = new Set()
/** `what` must come out as recorded clips; `whole` lines must not have fallen back to a bare counting number. */
function expect(what, clips, whole = true) {
  for (const clip of clips) {
    used.add(clip.text)
    // A builder given a number outside its recorded range falls back to the counting form ("seven!").
    if (whole && /^[a-z-]+!$/.test(clip.text)) outOfRange.set(what, clip.text)
    if (!clip.src) unrecorded.add(clip.text)
  }
}
const counting = (n, what) => {
  for (let k = 0; k <= n; k++) expect(`${what}: counting to ${n}`, [N.sayNumber(k)], false)
}
const tapped = (n, what) => {
  expect(`${what}: ${n} tapped`, [N.sayNumber(n)], false)
  expect(`${what}: wrong pick ${n}`, N.sayThats(n))
}

const SEEDS = 400
const STEPS = [0, 1, 2, 3, 4, 5]
const games = engine => NUMBER_GAMES.filter(g => g.engine === engine)

for (const d of R.DIFFICULTIES) {
  for (const step of STEPS) {
    for (let i = 0; i < R.ROUNDS_PER_SESSION; i++) {
      for (let seed = 0; seed < SEEDS; seed++) {
        const at = `${d}, step ${step}, round ${i + 1}`

        for (const game of games('collect')) {
          // As in CollectEngine's makeRound: fish and cakes only get topped up, and a cake fits ten candles.
          let r = R.collectRound(d, step, i, seeded(seed))
          const basket = game.id === 'collect' || game.id === 'farmer'
          if (!basket && r.kind === 'takeAway') r = { kind: 'add', start: r.start - r.remove, add: r.remove, pile: r.remove + 3 }
          const cap = basket ? 15 : 10
          if (r.kind === 'collect' && r.target > cap) r = { ...r, target: cap }
          if (r.kind === 'add' && r.start + r.add > cap) r = { ...r, start: cap - r.add }
          const what = `${game.title} (${at})`
          if (r.kind === 'collect') {
            expect(`${what}: "${game.ask}" ${r.target}`, N.sayAsk(game.ask, r.target))
            counting(r.target, what)
          }
          else if (r.kind === 'add') {
            expect(`${what}: ${r.start} add ${r.add}`, N.sayAddMore(r.start, r.add))
            expect(`${what}: ${r.start} + ${r.add}`, N.saySum(r.start, r.add))
            counting(r.start + r.add, what)
          }
          else {
            expect(`${what}: ${r.start} take away ${r.remove}`, N.sayTakeAway(r.start, r.remove))
            expect(`${what}: ${r.start} − ${r.remove}`, N.sayDifference(r.start, r.remove))
            counting(r.start, what)
          }
        }

        for (const game of games('find')) {
          const r = R.findRound(d, step, i, seeded(seed))
          const p = r.prompt
          const what = `${game.title} (${at})`
          if (p.kind === 'find') expect(`${what}: "${game.ask}" ${p.n}`, N.sayAsk(game.ask, p.n))
          if (p.kind === 'add') expect(`${what}: ${p.a} + ${p.b}`, N.sayAddQuestion(p.a, p.b))
          if (p.kind === 'sub') expect(`${what}: ${p.a} − ${p.b}`, N.sayTakeAwayQuestion(p.a, p.b))
          if (p.kind !== 'more' && p.kind !== 'less') r.choices.forEach(n => tapped(n, what))
          expect(`${what}: answer ${r.answer}`, [N.sayNumber(r.answer)], false)
          counting(Math.max(r.answer, ...r.choices), what)
        }

        for (const game of games('sequence')) {
          const r = R.sequenceRound(d, step, i, seeded(seed), false)
          const what = `${game.title} (${at})`
          ;[...r.values, ...r.extras].forEach(n => tapped(n, what))
        }

        for (const game of games('match')) {
          const r = R.matchRound(d, step, i, seeded(seed))
          const what = `${game.title} (${at})`
          r.groups.forEach((g) => { tapped(g.n, what); counting(g.n, what) })
        }
      }
    }
  }
  for (let seed = 0; seed < SEEDS * 5; seed++) {
    const plan = planJourney(d, seeded(seed))
    const what = `Number Train (${d})`
    ;[...plan.order, ...plan.missing.values, ...plan.missing.choices, ...plan.passengers.choices].forEach(n => tapped(n, what))
    counting(plan.passengers.count, what)
  }
}
if (outOfRange.size) {
  const list = [...outOfRange].slice(0, 15).map(([what, said]) => `  ${what}: only "${said}"`).join('\n')
  failures.push(`${outOfRange.size} Numbers lines are outside their recorded range, so they are said as a bare number:\n${list}${outOfRange.size > 15 ? `\n  … and ${outOfRange.size - 15} more` : ''}\nWiden the range in english-numbers.ts, then run \`npm run audio\`.`)
}
if (unrecorded.size) failures.push(`${unrecorded.size} different Numbers clips that rounds use have no recording, e.g. ${[...unrecorded].slice(0, 5).map(t => `"${t}"`).join(', ')}.`)

if (process.argv.includes('--unused')) {
  const extra = N.numbersAudioCatalog().filter(c => !used.has(c.text) && /\d/.test(c.id))
  console.log(`${extra.length} Numbers clips no sampled round uses:\n${extra.map(c => `  ${c.id}  "${c.text}"`).join('\n')}`)
}

// ---- report --------------------------------------------------------------------------------------------

if (failures.length) {
  console.error(`check:audio failed. The app would fall back to the device voice here:\n\n${failures.join('\n\n')}\n\nRun \`npm run audio\` to voice missing clips.`)
  process.exit(1)
}
console.log(`check:audio: all ${speech.length} speech clips are recorded, and every Numbers line is a recorded sentence.`)
