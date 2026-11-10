<script setup lang="ts">
import { LETTER_STROKES, STROKE_BOX } from '~/data/letter-strokes'

/**
 * Home: six big picture cards a non-reader can tell apart, plus sound toggle and a
 * hold-to-open parent entry tucked in the corner.
 */
const { effect, stop } = useAudio()
const { byId } = useAlphabetGame()
const apple = byId('a')!
const ball = byId('b')!
const writeSample = LETTER_STROKES.a!

function open(path: string) {
  stop()
  effect('page')
  navigateTo(path)
}
</script>

<template>
  <div class="safe-screen flex flex-col gap-4 overflow-y-auto">
    <header class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <img src="/icons/icon.svg" alt="" class="size-14 rounded-2xl shadow-sm" width="56" height="56">
        <div class="leading-tight">
          <p class="text-sm font-bold uppercase tracking-[0.2em] text-ink-soft">Visualout Kids</p>
          <h1 class="text-[1.7rem] font-black leading-none text-ink sm:text-4xl">My First ABC</h1>
        </div>
      </div>
      <SoundToggle />
    </header>

    <main class="grid flex-1 grid-cols-2 content-center gap-3 sm:gap-5 landscape:grid-cols-3">
      <!-- Explore: the primary mode, biggest card -->
      <button
        type="button"
        class="toy-press relative col-span-2 flex min-h-[22vh] flex-col items-center justify-center gap-2 overflow-hidden rounded-blob bg-peach p-6 text-peach-ink landscape:col-span-1 landscape:min-h-[33vh] landscape:p-3"
        aria-label="Explore alphabets"
        @click="open('/abc/explore')"
      >
        <span class="flex items-baseline gap-2 font-black leading-none">
          <span class="text-[min(22vw,13vh)] landscape:text-[min(8vw,15vh)]">A</span><span class="text-[min(13vw,8vh)] opacity-80 landscape:text-[min(5vw,9vh)]">a</span>
        </span>
        <ObjectIllustration :letter="apple" size="sm" class="animate-float absolute bottom-4 right-5 landscape:hidden" />
        <span class="text-2xl font-black">Explore</span>
      </button>

      <!-- Find the letter -->
      <button
        type="button"
        class="toy-press flex min-h-[17vh] flex-col items-center justify-center gap-2 rounded-blob bg-sky p-3 text-sky-ink landscape:min-h-[33vh]"
        aria-label="Find the letter"
        @click="open('/abc/find')"
      >
        <span class="flex items-center gap-1.5 text-3xl font-black sm:gap-2 sm:text-5xl landscape:!gap-1 landscape:!text-2xl" aria-hidden="true">
          <span class="grid size-11 place-items-center rounded-xl bg-white/70 sm:size-16 sm:rounded-2xl landscape:!size-9 landscape:!rounded-lg">B</span>
          <span class="grid size-11 place-items-center rounded-xl bg-white ring-4 ring-sunny sm:size-16 sm:rounded-2xl landscape:!size-9 landscape:!rounded-lg">A</span>
          <span class="grid size-11 place-items-center rounded-xl bg-white/70 sm:size-16 sm:rounded-2xl landscape:!size-9 landscape:!rounded-lg">C</span>
        </span>
        <span class="text-center text-xl font-black leading-tight sm:text-2xl landscape:!text-xl">Find the letter</span>
      </button>

      <!-- Match letter to object -->
      <button
        type="button"
        class="toy-press flex min-h-[17vh] flex-col items-center justify-center gap-2 rounded-blob bg-mint p-3 text-mint-ink landscape:min-h-[33vh]"
        aria-label="Match letter to picture"
        @click="open('/abc/match')"
      >
        <span class="flex items-center gap-1.5 sm:gap-3 landscape:!gap-1" aria-hidden="true">
          <span class="text-5xl font-black sm:text-6xl landscape:!text-4xl">B</span>
          <AppIcon name="next" class="size-6 sm:size-9 landscape:!size-5" />
          <span class="grid size-14 place-items-center rounded-2xl bg-white sm:size-20 landscape:!size-12"><ObjectIllustration :letter="ball" size="xs" class="!size-10 !text-4xl sm:!size-14 landscape:!size-9" /></span>
        </span>
        <span class="text-xl font-black sm:text-2xl">Match</span>
      </button>

      <!-- Write: trace the letters -->
      <button
        type="button"
        class="toy-press flex min-h-[16vh] flex-col items-center justify-center gap-1 rounded-blob bg-lilac p-3 text-lilac-ink landscape:min-h-[33vh] landscape:gap-1"
        aria-label="Write letters"
        @click="open('/abc/write')"
      >
        <span class="relative" aria-hidden="true">
          <svg :viewBox="`0 0 ${STROKE_BOX.width} ${STROKE_BOX.height}`" class="h-[8vh] min-h-12 landscape:h-[14vh]" fill="none" stroke="currentColor" stroke-linecap="round">
            <path v-for="(d, i) in writeSample" :key="i" :d="d" stroke-width="6" stroke-dasharray="0.01 9" stroke-opacity="0.5" />
            <path :d="writeSample[0]" stroke-width="11" />
          </svg>
          <AppIcon name="pencil" class="absolute -bottom-1 -right-4 size-10 rotate-12 text-lilac-ink" />
        </span>
        <span class="text-xl font-black sm:text-2xl">Write</span>
      </button>

      <!-- Webbo's Letter City: catch letter balloons in 3D -->
      <button
        type="button"
        class="toy-press relative flex min-h-[16vh] flex-col items-center justify-center gap-1 overflow-hidden rounded-blob bg-[#cfe7ff] p-3 text-sky-ink landscape:min-h-[33vh] landscape:gap-1"
        aria-label="Webbo's Letter City"
        @click="open('/abc/web')"
      >
        <span class="relative" aria-hidden="true">
          <WebboIcon class="h-[8vh] min-h-12 landscape:h-[13vh]" />
          <span class="absolute -right-5 -top-2 grid size-10 place-items-center rounded-[50%_50%_46%_46%] bg-[#FFD66B] text-xl font-black text-ink shadow sm:size-12 sm:text-2xl">B</span>
        </span>
        <span class="text-xl font-black sm:text-2xl">Webbo</span>
      </button>

      <!-- Letter Trails: follow the letter to get the animal home -->
      <button
        type="button"
        class="toy-press col-span-2 flex min-h-[14vh] items-center justify-center gap-3 overflow-hidden rounded-blob bg-[#d9f2c9] p-3 text-[#2f6b1f] landscape:col-span-1 landscape:min-h-[33vh] landscape:flex-col landscape:gap-1"
        aria-label="Letter Trails"
        @click="open('/abc/trail')"
      >
        <span class="flex items-center gap-1" aria-hidden="true">
          <TrailArt kind="bunny" class="size-12 landscape:size-10" />
          <span v-for="n in 3" :key="n" class="grid size-9 place-items-center rounded-lg border-[3px] border-[#ffc078] bg-[#fff4e0] text-xl font-black text-ink landscape:size-7 landscape:text-base">e</span>
          <TrailArt kind="carrots" class="size-12 landscape:size-10" />
        </span>
        <span class="text-xl font-black sm:text-2xl">Trails</span>
      </button>
    </main>

    <footer class="flex justify-start">
      <ParentGate @unlock="open('/abc/parents')" />
    </footer>
  </div>
</template>
