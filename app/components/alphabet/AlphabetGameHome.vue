<script setup lang="ts">
/**
 * Home: three big picture cards a non-reader can tell apart, plus sound toggle and a
 * hold-to-open parent entry tucked in the corner.
 */
const { effect, stop } = useAudio()
const { byId } = useAlphabetGame()
const apple = byId('a')!
const ball = byId('b')!

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

    <main class="grid flex-1 content-center gap-3 sm:gap-6 landscape:grid-cols-3 portrait:sm:grid-cols-2">
      <!-- Explore: the primary mode, biggest card -->
      <button
        type="button"
        class="toy-press relative flex min-h-[30vh] flex-col items-center justify-center gap-2 overflow-hidden rounded-blob bg-peach p-6 text-peach-ink portrait:sm:col-span-2 landscape:min-h-[60vh]"
        aria-label="Explore alphabets"
        @click="open('/explore')"
      >
        <span class="flex items-baseline gap-2 font-black leading-none">
          <span class="text-[min(24vw,15vh)]">A</span><span class="text-[min(14vw,9vh)] opacity-80">a</span>
        </span>
        <ObjectIllustration :letter="apple" size="sm" class="animate-float absolute bottom-4 right-5" />
        <span class="text-2xl font-black">Explore</span>
      </button>

      <!-- Find the letter -->
      <button
        type="button"
        class="toy-press flex min-h-[19vh] flex-col items-center justify-center gap-2 rounded-blob bg-sky p-4 text-sky-ink landscape:min-h-[60vh]"
        aria-label="Find the letter"
        @click="open('/find')"
      >
        <span class="flex items-center gap-2 text-5xl font-black sm:text-6xl" aria-hidden="true">
          <span class="grid size-16 place-items-center rounded-2xl bg-white/70 sm:size-20">B</span>
          <span class="grid size-16 place-items-center rounded-2xl bg-white ring-4 ring-sunny sm:size-20">A</span>
          <span class="grid size-16 place-items-center rounded-2xl bg-white/70 sm:size-20">C</span>
        </span>
        <span class="text-2xl font-black">Find the letter</span>
      </button>

      <!-- Match letter to object -->
      <button
        type="button"
        class="toy-press flex min-h-[19vh] flex-col items-center justify-center gap-2 rounded-blob bg-mint p-4 text-mint-ink landscape:min-h-[60vh]"
        aria-label="Match letter to picture"
        @click="open('/match')"
      >
        <span class="flex items-center gap-3" aria-hidden="true">
          <span class="text-6xl font-black sm:text-7xl">B</span>
          <AppIcon name="next" class="size-10" />
          <span class="grid size-20 place-items-center rounded-2xl bg-white"><ObjectIllustration :letter="ball" size="xs" class="!size-14 !text-5xl" /></span>
        </span>
        <span class="text-2xl font-black">Match</span>
      </button>
    </main>

    <footer class="flex justify-start">
      <ParentGate @unlock="open('/parents')" />
    </footer>
  </div>
</template>
