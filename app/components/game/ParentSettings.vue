<script setup lang="ts">
/** Parent area: sound, voice, progress reset and privacy notes. No links out, no accounts. */
const { settings, reset: resetSettings } = useSoundSettings()
const { exploredCount, writtenSet, letterStatus, levelOf, reset: resetProgress } = useGameProgress()
const trail = useTrailProgress()
const numbers = useNumbersProgress()
const { letters, pack } = useAlphabetGame()
const { say, effect, deviceVoiceSupported } = useAudio()

const musicInstalled = !!pack.backgroundMusic
const recorded = {
  letters: letters.filter(l => l.assets.letterAudio).length,
  words: letters.filter(l => l.assets.wordAudio).length,
  art: letters.filter(l => l.assets.illustration && !l.assets.illustrationIsPlaceholder).length,
}
const confirmReset = ref(false)

const NUMBER_LEVELS = { beginner: 'Beginner (1–5)', challenge: 'Challenge (1–10)', super: 'Super Challenge (1–20)' }
const LEVEL_NAMES = ['Very different letters', 'Mixed letters', 'Includes look-alikes (like E and F)']
const STATUS_CLASSES = { known: 'bg-mint text-mint-ink', practising: 'bg-butter text-butter-ink', new: 'bg-cream text-ink-soft/60' }
const shapes = computed(() => letters.map(l => ({ letter: l, status: letterStatus('find', l.id) })))
const knownCount = (mode: 'find' | 'match') => letters.filter(l => letterStatus(mode, l.id) === 'known').length

function testVoice() {
  effect('tap')
  say({ src: letters[0]!.assets.wordAudio, text: 'A is for Apple!' })
}

function clearProgress() {
  resetProgress()
  trail.reset()
  numbers.reset()
  confirmReset.value = false
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8">
    <section class="rounded-3xl bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-xl font-black">Sound</h2>

      <label class="flex min-h-16 items-center justify-between gap-4">
        <span class="font-bold">Sound on</span>
        <input v-model="settings.soundOn" type="checkbox" class="size-8 accent-coral">
      </label>

      <label class="flex min-h-16 flex-col justify-center gap-2">
        <span class="flex justify-between font-bold"><span>Volume</span><span class="text-ink-soft">{{ Math.round(settings.volume * 100) }}%</span></span>
        <input v-model.number="settings.volume" type="range" min="0" max="1" step="0.05" class="h-8 w-full accent-coral">
      </label>

      <label class="flex min-h-16 items-center justify-between gap-4">
        <span>
          <span class="block font-bold">Speak automatically</span>
          <span class="block text-sm text-ink-soft">Say the letter after Next, and the question at the start of each round.</span>
        </span>
        <input v-model="settings.autoInstructions" type="checkbox" class="size-8 shrink-0 accent-coral">
      </label>

      <label class="flex min-h-16 items-center justify-between gap-4">
        <span>
          <span class="block font-bold">Use device voice for missing recordings</span>
          <span class="block text-sm text-ink-soft">
            {{ deviceVoiceSupported ? 'Uses the voice built into this device. Nothing is sent online.' : 'This browser has no built-in voice; missing recordings stay silent.' }}
          </span>
        </span>
        <input v-model="settings.deviceVoiceFallback" type="checkbox" class="size-8 shrink-0 accent-coral" :disabled="!deviceVoiceSupported">
      </label>

      <label class="flex min-h-16 items-center justify-between gap-4" :class="!musicInstalled && 'opacity-50'">
        <span>
          <span class="block font-bold">Background music</span>
          <span class="block text-sm text-ink-soft">{{ musicInstalled ? 'Soft music while playing. Off by default.' : 'No music track installed yet.' }}</span>
        </span>
        <input v-model="settings.musicOn" type="checkbox" class="size-8 shrink-0 accent-coral" :disabled="!musicInstalled">
      </label>

      <button type="button" class="toy-press mt-2 min-h-16 w-full rounded-2xl bg-sky font-bold text-sky-ink" @click="testVoice">
        Test sound
      </button>
    </section>

    <section class="rounded-3xl bg-white p-5 shadow-sm">
      <h2 class="mb-2 text-xl font-black">Progress</h2>
      <p class="mb-2 text-ink-soft">Letters looked at: <b class="text-ink">{{ exploredCount }} / {{ letters.length }}</b>. Stored only on this device.</p>

      <h3 class="mt-4 font-black">Letter shapes recognised</h3>
      <p class="mb-3 text-sm text-ink-soft">
        From Find the letter. A letter counts as recognised after it's picked right on the first try 3 times in a row,
        so lucky guesses don't count.
      </p>
      <ul class="mb-3 grid grid-cols-7 gap-1.5 sm:grid-cols-13" aria-label="Letter shapes recognised">
        <li
          v-for="{ letter, status } in shapes"
          :key="letter.id"
          class="grid aspect-square place-items-center rounded-xl text-lg font-black"
          :class="STATUS_CLASSES[status]"
          :aria-label="`${letter.uppercase}: ${status === 'known' ? 'recognised' : status === 'practising' ? 'practising' : 'not tried yet'}`"
        >
          {{ letter.uppercase }}
        </li>
      </ul>
      <ul class="mb-4 space-y-1 text-sm text-ink-soft">
        <li><span class="mr-1 inline-block size-3 rounded bg-mint" /> Recognised · <span class="mr-1 inline-block size-3 rounded bg-butter" /> Practising · <span class="mr-1 inline-block size-3 rounded border border-ink-soft/30 bg-cream" /> Not tried yet</li>
        <li>Find the letter now uses: <b class="text-ink">{{ LEVEL_NAMES[levelOf('find')] }}</b>. It moves up or down on its own.</li>
        <li>Letters written in Write: <b class="text-ink">{{ writtenSet.size }} / {{ letters.length }}</b></li>
        <li>Starting sounds recognised in Match: <b class="text-ink">{{ knownCount('match') }} / {{ letters.length }}</b></li>
        <li>
          Letter Trails: <b class="text-ink">{{ trail.totalStars.value }} stars</b>, at level
          {{ trail.levelOf('beginner') }} in Beginner, {{ trail.levelOf('challenge') }} in Challenge and {{ trail.levelOf('super') }} in Super Challenge
        </li>
        <li>
          Numbers &amp; Counting: <b class="text-ink">{{ numbers.totalStars.value }} stars</b>, playing at
          <b class="text-ink">{{ NUMBER_LEVELS[numbers.difficulty.value] }}</b>
        </li>
      </ul>

      <button v-if="!confirmReset" type="button" class="toy-press min-h-16 w-full rounded-2xl bg-cream font-bold" @click="confirmReset = true">
        Clear progress
      </button>
      <div v-else class="flex gap-3">
        <button type="button" class="toy-press min-h-16 flex-1 rounded-2xl bg-coral font-bold text-white" @click="clearProgress">Yes, clear</button>
        <button type="button" class="toy-press min-h-16 flex-1 rounded-2xl bg-cream font-bold" @click="confirmReset = false">Cancel</button>
      </div>
      <button type="button" class="mt-3 min-h-12 w-full rounded-2xl font-bold text-ink-soft underline" @click="resetSettings">
        Restore default sound settings
      </button>
    </section>

    <section class="rounded-3xl bg-white p-5 shadow-sm">
      <h2 class="mb-2 text-xl font-black">Content status</h2>
      <ul class="space-y-1 text-ink-soft">
        <li>Recorded letter sounds: <b class="text-ink">{{ recorded.letters }} / 26</b></li>
        <li>Recorded words: <b class="text-ink">{{ recorded.words }} / 26</b></li>
        <li>Final illustrations: <b class="text-ink">{{ recorded.art }} / 26</b> (others use placeholder pictures)</li>
      </ul>
    </section>

    <section class="rounded-3xl bg-white p-5 text-ink-soft shadow-sm">
      <h2 class="mb-2 text-xl font-black text-ink">Privacy & safety</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li>No accounts, ads, purchases, tracking or analytics.</li>
        <li>No personal information is collected. Settings stay on this device.</li>
        <li>Nothing a child can tap leaves the app. The only outside links are on this page and the parents' home page.</li>
        <li>Works offline once installed.</li>
        <li>No timers, scores or reminders to come back.</li>
      </ul>
    </section>

    <section class="rounded-3xl bg-white p-5 shadow-sm">
      <h2 class="mb-3 text-xl font-black">Made with care by Visualout</h2>
      <MadeByVisualout />
    </section>
  </div>
</template>
