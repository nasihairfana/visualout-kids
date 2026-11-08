<script setup lang="ts">
import type { Round } from '~/composables/useAlphabetGame'
import type { Celebration } from '~/composables/useChoiceActivity'
import type { Insets, WebboWorld, WorldLetter } from '~/games/webbo/world'

/**
 * Hosts the 3D city (rooftop view, or the side view with `?view=side`). three.js is imported here
 * on demand, so it's only downloaded on /abc/web.
 * Emits `unsupported` if the device can't draw it, so the game can switch to the flat version.
 */
const props = defineProps<{
  round: Round
  solved: boolean
  waiting: boolean
  calming: boolean
  showHint: boolean
  wiggling: string | null
  nudges: number
  insets: Insets
  celebration: Celebration
  /** The fifth balloon is done: play the finale, then emit `finaleDone`. */
  finished: boolean
  /** Bumped when the child asks to see Webbo's web move again. */
  moves: number
}>()
const emit = defineEmits<{ pick: [id: string], unsupported: [], finaleDone: [] }>()
const { effect } = useAudio()

const canvas = ref<HTMLCanvasElement | null>(null)
const hitLayer = ref<HTMLElement | null>(null)
const ready = ref(false)
let world: WebboWorld | null = null
let resizer: ResizeObserver | null = null

const toWorld = (round: Round): WorldLetter[] => round.choices.map(l => ({
  id: l.id,
  label: l.uppercase,
  picture: l.assets.illustration,
  word: l.word,
}))

const pushState = () => world?.setState({ waiting: props.waiting, calming: props.calming, hint: props.showHint })

onMounted(async () => {
  // Rooftop view by default; `?view=side` keeps the original side-on view for comparison.
  const side = useRoute().query.view === 'side'
  const { WebboWorld, supportsWebGL } = await import('~/games/webbo/world')
  const World = side ? WebboWorld : (await import('~/games/webbo/rooftop')).RooftopWorld
  if (!canvas.value || !hitLayer.value) return
  if (!supportsWebGL()) return emit('unsupported')
  try {
    world = new World({
      canvas: canvas.value,
      hitLayer: hitLayer.value,
      onPick: id => emit('pick', id),
      onSound: name => effect(name),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    })
  }
  catch {
    return emit('unsupported')
  }
  canvas.value.addEventListener('webglcontextlost', () => emit('unsupported'), { once: true })
  // Local development only: lets the world be inspected from the browser console.
  if (import.meta.dev) (window as unknown as { __webbo?: unknown }).__webbo = world
  world.setInsets(props.insets)
  world.setRound(toWorld(props.round), props.round.target.id)
  pushState()
  resizer = new ResizeObserver(() => world?.resize())
  resizer.observe(canvas.value)
  ready.value = true
})

watch(() => props.round, round => world?.setRound(toWorld(round), round.target.id))
watch(() => props.solved, (solved) => { if (solved) world?.catch(props.round.target.id, props.celebration) })
watch(() => props.finished, (finished) => {
  if (!finished) return
  const seconds = world?.finale() ?? 0
  setTimeout(() => emit('finaleDone'), seconds * 1000)
})
watch(() => props.moves, () => world?.showMove())
watch(() => [props.waiting, props.calming, props.showHint], pushState)
watch(() => props.wiggling, (id) => { if (id) world?.wiggle(id) })
watch(() => props.nudges, () => world?.nudge())
watch(() => props.insets, insets => world?.setInsets(insets), { deep: true })

onBeforeUnmount(() => {
  resizer?.disconnect()
  world?.dispose()
  world = null
})
</script>

<template>
  <div class="overflow-hidden">
    <canvas ref="canvas" class="block size-full transition-opacity duration-500" :class="ready ? 'opacity-100' : 'opacity-0'" />
    <!-- One invisible button per balloon, kept over it by the world. -->
    <!-- Also where a web is swiped from Webbo to a balloon, so the browser mustn't scroll or zoom. -->
    <div ref="hitLayer" class="absolute inset-0 touch-none" />
  </div>
</template>
