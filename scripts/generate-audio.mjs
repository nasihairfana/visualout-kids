/**
 * Voices every speech clip in the English pack with Kokoro, an open (Apache-2.0) neural TTS
 * model that runs entirely on this machine, then writes `app/data/audio-manifest.json`.
 *
 *   npm run audio               generate missing clips, then rescan
 *   npm run audio -- --force    regenerate clips this script made (never files replaced since)
 *   npm run audio -- --scan     only rescan /public/audio and rewrite the manifest
 *   npm run audio -- --phonemes check how the model will read every clip (letters especially), generate nothing
 *
 * Every clip is trimmed (~50 ms of silence kept), gently compressed, brought to −16 LUFS under a
 * −2 dB peak limiter, and saved as mono 24 kHz 64 kbps MP3 (see `master()`). The first run
 * downloads the model (~330 MB) into the Hugging Face cache; later runs work offline.
 * Needs Node 22.18+ (it imports the pack's TypeScript data directly) and ffmpeg: `ffmpeg-static`
 * if its download worked, otherwise `FFMPEG_PATH` or an `ffmpeg` on the PATH.
 */
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { KokoroTTS } from 'kokoro-js'
import { audioCatalog } from '../app/data/english-alphabets.ts'

const run = promisify(execFile)

const PUBLIC = 'public'
const MANIFEST = 'app/data/audio-manifest.json'
const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX'
/** Warm, clear American English female voice; Kokoro's highest-graded voice. */
const VOICE = 'af_heart'
/** A little slower than conversational, so toddlers can follow. */
const SPEED = 0.9
/** Every clip is brought to this loudness, so nothing is quieter than the rest. */
const TARGET_LUFS = -16
/** Sample-peak ceiling (≈ −2 dBFS), leaving room for MP3 encoding overshoot. */
const PEAK_CEILING = 0.79
/** The encoded clip's true peak must stay under this (dBTP), so it never clips on a phone's DAC. */
const TRUE_PEAK_LIMIT = -1.5
/**
 * Kokoro speaks at 24 kHz, so nothing is lost by keeping that rate, and 64 kbps mono is plenty
 * for speech without anything above 12 kHz. A third smaller than 44.1 kHz / 96 kbps, which
 * matters: every clip is precached for offline play on low-end phones.
 */
const SAMPLE_RATE = 24000
const BITRATE = '64k'

/**
 * What to feed the model. `clip.engine` is a respelling where the display text would be misread
 * (see `ENGINE_LETTER` in english-alphabets.ts: a lone "A" is read as the article "uh").
 */
function engineText(clip) {
  const text = clip.engine ?? clip.text
  if (clip.kind === 'letters') return `${text}.` // a full stop gives a calm, finished intonation
  return text
}

const args = new Set(process.argv.slice(2))
const force = args.has('--force')
const scanOnly = args.has('--scan')
const phonemesOnly = args.has('--phonemes')

const catalog = audioCatalog()

if (phonemesOnly) {
  await checkPhonemes()
  process.exit()
}

const previous = JSON.parse(await readFile(MANIFEST, 'utf8'))
/** path → hash of the file this script wrote. A file whose hash no longer matches was replaced by hand. */
const generated = new Map(Object.entries(previous.generated ?? {}))
const onDisk = clip => existsSync(join(PUBLIC, clip.path))
const hashOf = path => createHash('sha256').update(readFileSync(join(PUBLIC, path))).digest('hex').slice(0, 16)
const stillGenerated = path => existsSync(join(PUBLIC, path)) && generated.get(path) === hashOf(path)

if (!scanOnly) {
  // Only touch files that are missing, or (with --force) that this script made and nobody has replaced.
  const todo = catalog.filter(c => c.text && (!onDisk(c) || (force && stillGenerated(c.path))))
  if (todo.length) {
    const ffmpeg = await findFfmpeg()
    const tts = await loadModel()
    const tmp = await mkdtemp(join(tmpdir(), 'vk-audio-'))
    try {
      for (const [i, clip] of todo.entries()) {
        const wav = join(tmp, 'clip.wav')
        const out = join(PUBLIC, clip.path)
        const audio = await tts.generate(engineText(clip), { voice: VOICE, speed: SPEED })
        await writeFile(wav, Buffer.from(audio.toWav()))
        await mkdir(dirname(out), { recursive: true })
        await master(ffmpeg, wav, out)
        generated.set(clip.path, hashOf(clip.path))
        console.log(`[${i + 1}/${todo.length}] ${clip.path}  "${clip.text}"`)
      }
    }
    finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }
  else {
    console.log('Nothing to generate.')
  }
}

const present = kind => catalog.filter(c => c.kind === kind && onDisk(c)).map(c => c.id)
const manifest = {
  letters: present('letters'),
  words: present('words'),
  objects: present('objects'),
  phrases: present('phrases'),
  /** Files this script made, so --force can replace them without touching human recordings. */
  generated: Object.fromEntries([...generated].filter(([p]) => stillGenerated(p)).sort(([a], [b]) => a.localeCompare(b))),
}
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
const total = catalog.filter(c => c.text).length
const have = manifest.letters.length + manifest.words.length + manifest.phrases.length
console.log(`Manifest: ${have}/${total} speech clips, ${manifest.objects.length} object sounds.`)

async function loadModel() {
  console.log(`Loading ${MODEL}…`)
  return KokoroTTS.from_pretrained(MODEL, { dtype: 'fp32', device: 'cpu' })
}

/** `FFMPEG_PATH`, then `ffmpeg-static` (an optional dependency whose download can fail), then `ffmpeg` on the PATH. */
async function findFfmpeg() {
  const bundled = await import('ffmpeg-static').then(m => m.default).catch(() => null)
  for (const bin of [process.env.FFMPEG_PATH, bundled, 'ffmpeg'].filter(Boolean)) {
    try {
      await run(bin, ['-hide_banner', '-version'])
      return bin
    }
    catch { /* try the next one */ }
  }
  console.error('ffmpeg not found. Run `npm rebuild ffmpeg-static`, install ffmpeg (e.g. `brew install ffmpeg`), or set FFMPEG_PATH.')
  process.exit(1)
}

/**
 * Trim, compress, normalise and encode one clip.
 * Kokoro's plosives peak far above the speech around them, so plain loudness normalisation runs
 * out of headroom and leaves some clips ~6 dB quiet. A gentle speech compressor evens that out
 * first (it also carries better on small phone speakers), then a fixed gain and a limiter.
 * MP3 encoding can push a peak back over the limiter's ceiling (more so at 64 kbps), so the
 * encoded file's true peak is measured, and the few clips over the limit are encoded again with
 * a lower ceiling.
 */
async function master(ffmpeg, wav, out) {
  const trim = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05'
  const shape = `${trim},areverse,${trim},areverse,acompressor=threshold=-24dB:ratio=3:attack=5:release=60:knee=4`
  const { stderr } = await run(ffmpeg, ['-hide_banner', '-i', wav, '-af', `${shape},loudnorm=print_format=json`, '-f', 'null', '-'])
  const measuredI = Number(JSON.parse(stderr.slice(stderr.lastIndexOf('{'))).input_i)
  const gain = (TARGET_LUFS - measuredI).toFixed(2)
  let ceiling = PEAK_CEILING
  for (let tries = 1; ; tries++) {
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', wav,
      '-af', `${shape},volume=${gain}dB,aresample=${SAMPLE_RATE},alimiter=limit=${ceiling.toFixed(3)}:level=false`,
      '-ar', String(SAMPLE_RATE), '-ac', '1', '-b:a', BITRATE, out])
    const peak = await truePeak(ffmpeg, out)
    if (peak <= TRUE_PEAK_LIMIT || tries === 4) return
    ceiling *= 10 ** ((TRUE_PEAK_LIMIT - 0.3 - peak) / 20)
  }
}

/** True peak of a file, in dBTP. */
async function truePeak(ffmpeg, file) {
  const { stderr } = await run(ffmpeg, ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
  const peak = stderr.match(/True peak:\s+Peak:\s+(-?[\d.]+)/)
  return peak ? Number(peak[1]) : -Infinity
}

/**
 * `--phonemes`: how the model will read each clip, without generating anything. Every letter in a
 * phrase ("Find big A and little A!") must come out as its letter name, the same phonemes as the
 * letter said on its own; a mismatch is listed so it can get a respelling in `ENGINE_LETTER`.
 * The full list goes to a file for reading through.
 */
async function checkPhonemes() {
  const tts = await loadModel()
  // kokoro-js doesn't export its phonemizer, but `generate()` hands the phonemes straight to the
  // tokenizer. Catch them there and stop before any audio is made.
  const tokenizer = tts.tokenizer
  let caught = ''
  const STOP = Symbol('stop')
  tts.tokenizer = (phonemes) => { caught = phonemes; throw STOP }
  const phonemesOf = async (text) => {
    try { await tts.generate(text, { voice: VOICE, speed: SPEED }) }
    catch (err) { if (err !== STOP) throw err }
    return caught
  }
  const bare = s => s.replace(/[ˈˌ.,!?;:…"“”]/g, '').trim()

  const letterSound = new Map()
  for (const clip of catalog.filter(c => c.kind === 'letters')) letterSound.set(clip.text, bare(await phonemesOf(engineText(clip))))
  console.log(`Letter names: ${[...letterSound].map(([l, p]) => `${l} /${p}/`).join('  ')}`)

  const lines = []
  const problems = []
  for (const clip of catalog.filter(c => c.text)) {
    const input = engineText(clip)
    const phonemes = await phonemesOf(input)
    // Where there is a respelling, also show how the plain text would have been read.
    const plain = clip.engine ? `\t(plain "${clip.text}" → ${await phonemesOf(engineText({ ...clip, engine: undefined }))})` : ''
    lines.push(`${clip.kind}/${clip.id}\t${input}\t${phonemes}${plain}`)
    if (clip.kind !== 'phrases') continue
    // Line up the display words with the phoneme words and check each single capital letter.
    const words = clip.text.split(/\s+/)
    const said = phonemes.split(/\s+/)
    words.forEach((word, k) => {
      const letter = bare(word)
      if (!/^[A-Z]$/.test(letter)) return
      if (words.length !== said.length) return problems.push(`${clip.id}: can't line up words, listen to it ("${input}" → ${phonemes})`)
      if (bare(said[k]) !== letterSound.get(letter)) problems.push(`${clip.id}: "${letter}" is read /${bare(said[k])}/, not /${letterSound.get(letter)}/ ("${input}")`)
    })
  }
  const report = join(tmpdir(), 'visualout-kids-phonemes.tsv')
  await writeFile(report, `${lines.join('\n')}\n`)
  tts.tokenizer = tokenizer
  console.log(`Phonemes of ${lines.length} clips: ${report}`)
  if (problems.length) {
    console.log(`\n${problems.length} letter(s) misread:\n${problems.join('\n')}`)
    process.exitCode = 1
  }
  else {
    console.log('Every letter in every phrase is read as its letter name.')
  }
}
