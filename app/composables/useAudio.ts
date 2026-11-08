import { readonly, ref, watch } from 'vue'
import type { SpokenClip } from '~/types/learning'

/**
 * Visualout Kids audio service.
 *
 * Channels
 * - speech: letter names, words, instructions, praise. Only ONE clip at a time: starting new
 *   speech always stops the previous one (recording or device voice).
 * - object: optional environmental sounds (apple crunch, lion roar). Shares the speech channel
 *   so it never talks over a word.
 * - effects: tiny synthesized chimes (Web Audio, no files needed). A new effect stops the last.
 * - music: optional looping track, off by default, only if a file is installed.
 *
 * Fallbacks, in order: local recording → on-device voice (if enabled) → silence.
 * Nothing here throws: missing files, blocked autoplay or absent APIs just resolve quietly.
 * Nothing plays unless a caller asks, and callers only ask in response to a tap or a
 * round the child started.
 */


export type EffectName = 'tap' | 'page' | 'success' | 'found' | 'stroke' | 'tryAgain' | 'celebrate' | 'wiggle' | 'whoosh'

// ---- module singletons (client only) ---------------------------------------------------

const speaking = ref(false)
const unavailable = new Set<string>()
let token = 0
let currentEl: HTMLAudioElement | null = null
let audioCtx: AudioContext | null = null
let effectNodes: AudioScheduledSourceNode[] = []
let musicEl: HTMLAudioElement | null = null
let cachedVoice: SpeechSynthesisVoice | null | undefined
let initialised = false

const hasSpeech = () => import.meta.client && 'speechSynthesis' in window

/** Device-voice delivery. A natural pitch with a slightly slower pace sounds warm; a raised pitch sounds squeaky. */
const VOICE_TUNING = { rate: 0.9, pitch: 1.0 }

// Voice names are matched on the name only; every English voice's lang already says en-US / en-GB.
/** macOS/iOS novelty voices. Never used for a child. */
const NOVELTY_VOICES = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox)\b/i
/** Old formant or "Eloquence" voices: understandable, but flat and robotic. */
const ROBOTIC_VOICES = /\b(fred|junior|ralph|kathy|vicki|victoria|princess|agnes|bruce|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i
/** Warm, clear voices commonly installed on Apple, Android and Windows devices. */
const WARM_VOICES = /\b(samantha|ava|allison|susan|karen|moira|tessa|serena|zoe|nicky|aria|jenny|ana|libby|sonia|google)\b/i
/** Higher-quality variants of a voice. */
const QUALITY_VOICES = /\b(enhanced|premium|natural|neural)\b/i

function scoreVoice(v: SpeechSynthesisVoice, preferredLang: string): number {
  let score = 0
  if (WARM_VOICES.test(v.name)) score += 3
  if (QUALITY_VOICES.test(v.name)) score += 2
  if (ROBOTIC_VOICES.test(v.name)) score -= 3
  if (v.lang.replace('_', '-').toLowerCase() === preferredLang.toLowerCase()) score += 1
  return score
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice
  if (!hasSpeech()) return (cachedVoice = null)
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null // voices load async; try again next time
  const preferredLang = lang === 'en' ? 'en-US' : lang
  // On-device voices only, so nothing depends on an online TTS service.
  const candidates = voices.filter(v => v.localService && v.lang.toLowerCase().startsWith(lang) && !NOVELTY_VOICES.test(v.name))
  let best: SpeechSynthesisVoice | null = null
  let bestScore = -Infinity
  for (const v of candidates) {
    const score = scoreVoice(v, preferredLang)
    if (score > bestScore) { best = v; bestScore = score }
  }
  cachedVoice = best // null → system default voice (on Android this is the on-device TTS engine)
  return cachedVoice
}

function stopCurrent() {
  token++
  if (currentEl) {
    currentEl.pause()
    currentEl.src = ''
    currentEl = null
  }
  if (hasSpeech()) window.speechSynthesis.cancel()
  speaking.value = false
}

function playFile(src: string, volume: number, myToken: number): Promise<boolean> {
  if (unavailable.has(src)) return Promise.resolve(false)
  return new Promise((resolve) => {
    const el = new Audio(src)
    el.volume = volume
    currentEl = el
    let settled = false
    const done = (played: boolean) => {
      if (settled) return
      settled = true
      if (currentEl === el) currentEl = null
      resolve(played)
    }
    el.addEventListener('ended', () => done(true))
    // Fires for our own stop, just before `ended`, and when the OS interrupts playback.
    // Settle on all of them so a sequence never waits on a clip that won't resume. A pause caused
    // by a load/decode failure is left to the `error` handler, so the device voice can step in.
    el.addEventListener('pause', () => { if (myToken !== token || !el.error) done(true) })
    el.addEventListener('error', () => {
      // Missing or undecodable — don't keep retrying. (Ignore errors caused by our own stop.)
      if (myToken === token) unavailable.add(src)
      done(myToken !== token)
    })
    el.play().catch((err: unknown) => {
      // NotAllowedError = no user gesture yet. Not the file's fault, so don't blacklist it.
      if (!(err instanceof DOMException && err.name === 'NotAllowedError')) unavailable.add(src)
      done(false)
    })
  })
}

function speakText(text: string, lang: string, volume: number, myToken: number): Promise<void> {
  if (!hasSpeech()) return Promise.resolve()
  return new Promise((resolve) => {
    const synth = window.speechSynthesis
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang === 'en' ? 'en-US' : lang
    const voice = pickVoice(lang)
    if (voice) u.voice = voice
    u.rate = VOICE_TUNING.rate
    u.pitch = VOICE_TUNING.pitch
    u.volume = volume
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      clearTimeout(guard)
      resolve()
    }
    // Some engines never fire `end`; never let a sequence hang.
    const guard = setTimeout(done, 1500 + text.length * 160)
    u.onend = done
    u.onerror = done
    if (myToken !== token) return done()
    synth.speak(u)
  })
}

// ---- effects (synthesized, so they always work offline) ---------------------------------

const NOTES: Record<EffectName, Array<[freq: number, start: number, dur: number]>> = {
  tap: [[660, 0, 0.08]],
  page: [[523, 0, 0.07], [784, 0.06, 0.09]],
  success: [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.12], [1047, 0.3, 0.28]],
  // Gentler than `success`: for a pick made with the hint's help.
  found: [[523, 0, 0.12], [784, 0.12, 0.22]],
  // A line of a letter traced: small and bright, so it can repeat without getting tiring.
  stroke: [[784, 0, 0.08], [1047, 0.07, 0.14]],
  // Webbo wiggling its fingers: a quick, light trill.
  wiggle: [[880, 0, 0.06], [988, 0.07, 0.06], [880, 0.14, 0.06], [988, 0.21, 0.06], [1175, 0.28, 0.08]],
  // Played as a noise sweep, not notes (see `playWhoosh`).
  whoosh: [],
  // Deliberately warm and "rising" — an invitation, never a buzzer.
  tryAgain: [[392, 0, 0.14], [523, 0.14, 0.2]],
  celebrate: [[523, 0, 0.1], [659, 0.09, 0.1], [784, 0.18, 0.1], [1047, 0.27, 0.12], [784, 0.4, 0.1], [1047, 0.5, 0.12], [1319, 0.6, 0.35]],
}

/** A soft rising "whoosh" for a web being thrown: filtered noise, swept upwards. */
function playWhoosh(ctx: AudioContext, volume: number) {
  const duration = 0.38
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.4
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + 0.01
  filter.frequency.setValueAtTime(500, t0)
  filter.frequency.exponentialRampToValueAtTime(2800, t0 + duration)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.35 * volume, t0 + 0.06)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  noise.connect(filter).connect(gain).connect(ctx.destination)
  noise.start(t0)
  noise.stop(t0 + duration + 0.02)
  return noise
}

function playEffect(name: EffectName, volume: number) {
  if (!import.meta.client) return
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return
  try {
    audioCtx ??= new Ctx()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    effectNodes.forEach((n) => { try { n.stop() } catch { /* already stopped */ } })
    effectNodes = []
    if (name === 'whoosh') {
      effectNodes.push(playWhoosh(audioCtx, volume))
      return
    }
    const t0 = audioCtx.currentTime + 0.01
    for (const [freq, start, dur] of NOTES[name]) {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = name === 'tryAgain' ? 'sine' : 'triangle'
      osc.frequency.value = freq
      const peak = 0.22 * volume
      gain.gain.setValueAtTime(0.0001, t0 + start)
      gain.gain.exponentialRampToValueAtTime(peak, t0 + start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur)
      osc.connect(gain).connect(audioCtx.destination)
      osc.start(t0 + start)
      osc.stop(t0 + start + dur + 0.02)
      effectNodes.push(osc)
    }
  }
  catch { /* audio unavailable — effects are optional */ }
}

// ---- public composable ------------------------------------------------------------------

export function useAudio(lang = 'en') {
  const { settings } = useSoundSettings()

  if (import.meta.client && !initialised) {
    initialised = true
    if (hasSpeech()) window.speechSynthesis.onvoiceschanged = () => { cachedVoice = undefined }
    // iOS/iPadOS: let speech and effects play even when the ring/silent switch is on.
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
    if (session) {
      try { session.type = 'playback' }
      catch { /* unsupported value — keep the browser default */ }
    }
    // Never keep talking when the app is backgrounded.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { stopCurrent(); musicEl?.pause() }
    })
    watch(() => settings.value.soundOn, (on) => { if (!on) { stopCurrent(); musicEl?.pause() } })
    watch(() => settings.value.volume, (v) => {
      if (currentEl) currentEl.volume = v
      if (musicEl) musicEl.volume = v * 0.25
    })
  }

  /** Play one or more clips in order, replacing anything currently being said. */
  async function say(clips: SpokenClip | SpokenClip[]): Promise<void> {
    stopCurrent()
    if (!import.meta.client || !settings.value.soundOn) return
    const myToken = token
    speaking.value = true
    for (const clip of Array.isArray(clips) ? clips : [clips]) {
      if (myToken !== token) return
      const volume = settings.value.volume
      const played = clip.src ? await playFile(clip.src, volume, myToken) : false
      if (!played && clip.text && settings.value.deviceVoiceFallback && myToken === token) {
        await speakText(clip.text, lang, volume, myToken)
      }
    }
    if (myToken === token) speaking.value = false
  }

  function effect(name: EffectName) {
    if (settings.value.soundOn) playEffect(name, settings.value.volume)
  }

  /** Start/stop the optional background loop. Does nothing if no track is installed. */
  function setMusic(src: string | null, on: boolean) {
    if (!import.meta.client) return
    if (!on || !src || !settings.value.soundOn) {
      musicEl?.pause()
      return
    }
    if (!musicEl || !musicEl.src.endsWith(src)) {
      musicEl?.pause()
      musicEl = new Audio(src)
      musicEl.loop = true
    }
    musicEl.volume = settings.value.volume * 0.25
    musicEl.play().catch(() => { /* missing file or no gesture yet */ })
  }

  return {
    say,
    effect,
    stop: stopCurrent,
    setMusic,
    speaking: readonly(speaking),
    /** Whether the device can speak missing recordings at all. */
    deviceVoiceSupported: hasSpeech(),
  }
}
