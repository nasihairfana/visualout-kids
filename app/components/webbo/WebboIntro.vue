<script setup lang="ts">
/**
 * "Do it with me!": before the first balloon, Webbo shows its web move (wiggle the fingers like
 * spider legs, then point: whoosh!) and a big hand on screen invites the child to copy it with
 * their own hand. Pretend play only: no camera. Shown once per visit (see pages/abc/web.vue).
 *
 * The move is Webbo's own, from the Itsy Bitsy Spider finger play that toddlers already know;
 * it deliberately isn't Spider-Man's web-shooting hand sign.
 */
const emit = defineEmits<{ done: [] }>()
const { say, effect, stop } = useAudio()
const { clips, pack } = useAlphabetGame()

// One cycle is 3.2 s: wiggle for the first half, point for the second (matches the CSS below).
const CYCLE_MS = 3200
const pointing = ref(false)
const timers: ReturnType<typeof setTimeout>[] = []

onMounted(() => {
  say(clips.phrase(pack.phrases.wiggleAndPoint))
  // Download the 3D city while the child is busy wiggling.
  void import('~/games/webbo/world')
  for (let cycle = 0; cycle < 12; cycle++) {
    timers.push(setTimeout(() => {
      pointing.value = false
      if (cycle < 2) effect('wiggle')
    }, cycle * CYCLE_MS))
    timers.push(setTimeout(() => {
      pointing.value = true
      if (cycle < 2) effect('whoosh')
    }, cycle * CYCLE_MS + CYCLE_MS * 0.52))
  }
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  stop()
})

function play() {
  effect('page')
  emit('done')
}
</script>

<template>
  <div class="safe-screen flex flex-col gap-2 bg-gradient-to-b from-[#bfe0ff] to-cream">
    <GameTopBar />

    <main class="flex min-h-0 flex-1 flex-col items-center justify-center gap-[2vh] landscape:flex-row landscape:gap-[6vw]">
      <div class="flex items-end gap-[4vw]" aria-hidden="true">
        <WebboIcon :pose="pointing ? 'point' : 'rest'" :wiggle="!pointing" :happy="pointing" class="w-[min(30vw,22vh)] landscape:w-[min(22vw,34vh)]" />

        <!-- A big friendly hand to copy -->
        <svg viewBox="0 0 200 230" class="intro-hand w-[min(42vw,30vh)] overflow-visible">
          <g class="whoosh" stroke="#FFC94D" stroke-width="7" stroke-linecap="round">
            <line x1="62" y1="-6" x2="56" y2="-34" /><line x1="44" y1="0" x2="28" y2="-22" /><line x1="80" y1="0" x2="92" y2="-24" />
          </g>
          <g fill="#FFD8C2" stroke="#8A3412" stroke-width="5" stroke-linejoin="round">
            <rect class="finger index" x="52" y="22" width="26" height="110" rx="13" />
            <rect class="finger curl" x="80" y="10" width="26" height="120" rx="13" />
            <rect class="finger curl" x="108" y="20" width="26" height="110" rx="13" />
            <rect class="finger curl" x="135" y="44" width="22" height="90" rx="11" />
            <rect x="12" y="112" width="26" height="70" rx="13" transform="rotate(-38 25 147)" />
            <rect x="44" y="100" width="118" height="110" rx="44" />
          </g>
        </svg>
      </div>

      <div class="flex flex-col items-center gap-[2vh]">
        <p class="max-w-[22rem] text-center text-[clamp(1.6rem,7vw,2.4rem)] font-black leading-tight text-ink">
          Wiggle your fingers…<br><span class="text-lilac-ink">and point!</span>
        </p>
        <button
          type="button"
          class="toy-press flex min-h-24 items-center gap-3 rounded-full bg-sunny pl-8 pr-6 text-2xl font-black text-ink"
          aria-label="Let's play"
          @click="play"
        >
          Let's play
          <AppIcon name="next" class="size-10 animate-nudge" />
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Fingers wiggle for the first half of each 3.2 s cycle; then three curl down and the index points. */
.finger {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}
.curl { animation: wiggle-then-curl 3.2s ease-in-out infinite; }
.index { animation: wiggle-then-point 3.2s ease-in-out infinite; }
.curl:nth-child(3) { animation-delay: -0.05s; }
.curl:nth-child(4) { animation-delay: -0.1s; }
.whoosh { opacity: 0; animation: whoosh 3.2s ease-out infinite; }

@keyframes wiggle-then-curl {
  0%, 10%, 20%, 30%, 40% { transform: rotate(-9deg); }
  5%, 15%, 25%, 35%, 45% { transform: rotate(9deg); }
  50% { transform: rotate(0); }
  58%, 96% { transform: scaleY(0.38); }
  100% { transform: rotate(0); }
}
@keyframes wiggle-then-point {
  0%, 10%, 20%, 30%, 40% { transform: rotate(9deg); }
  5%, 15%, 25%, 35%, 45% { transform: rotate(-9deg); }
  50% { transform: rotate(0); }
  58%, 96% { transform: translateY(-10px); }
  100% { transform: rotate(0); }
}
@keyframes whoosh {
  0%, 54% { opacity: 0; transform: translateY(14px); }
  62% { opacity: 1; }
  90% { opacity: 0; transform: translateY(-18px); }
  100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .curl { animation: none; transform: scaleY(0.38); }
  .index, .whoosh { animation: none; }
  .whoosh { opacity: 1; }
}
</style>
