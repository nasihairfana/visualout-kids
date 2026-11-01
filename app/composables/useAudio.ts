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


export type EffectName = 'tap' | 'page' | 'success' | 'found' | 'tryAgain' | 'celebrate'

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

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice
  if (!hasSpeech()) return (cachedVoice = null)
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null // voices load async; try again next time
  const matching = voices.filter(v => v.lang.toLowerCase().startsWith(lang))
  // Prefer on-device voices so nothing depends on an online TTS service.
  cachedVoice = matching.find(v => v.localService && /female|samantha|karen|zira|en-gb|en-us/i.test(`${v.name} ${v.lang}`))
    ?? matching.find(v => v.localService)
    ?? null // null → system default voice (on Android this is the on-device TTS engine)
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
    el.addEventListener('pause', () => { if (myToken !== token) done(true) })
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
    u.rate = 0.82
    u.pitch = 1.15
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
  // Deliberately warm and "rising" — an invitation, never a buzzer.
  tryAgain: [[392, 0, 0.14], [523, 0.14, 0.2]],
  celebrate: [[523, 0, 0.1], [659, 0.09, 0.1], [784, 0.18, 0.1], [1047, 0.27, 0.12], [784, 0.4, 0.1], [1047, 0.5, 0.12], [1319, 0.6, 0.35]],
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
