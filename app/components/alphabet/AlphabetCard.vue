<script setup lang="ts">
import type { AlphabetLetter } from '~/types/learning'

/**
 * The big letter: uppercase hero with its lowercase partner.
 * Tapping says the letter, wiggles it and lights it up.
 */
const props = withDefaults(defineProps<{
  letter: AlphabetLetter
  showLowercase?: boolean
  speakOnTap?: boolean
  size?: 'hero' | 'choice' | 'sample'
  /** White card with dark ink, so a matching game can't be solved by colour alone. */
  plain?: boolean
}>(), { showLowercase: true, speakOnTap: true, size: 'hero', plain: false })

const emit = defineEmits<{ tap: [letter: AlphabetLetter] }>()

const { say, effect } = useAudio()
const { clips } = useAlphabetGame()
const animating = ref(false)
const highlighted = ref(false)
const theme = computed(() => themeOf(props.letter.theme))

async function onTap() {
  emit('tap', props.letter)
  if (!props.speakOnTap) return
  effect('tap')
  animating.value = false
  requestAnimationFrame(() => { animating.value = true })
  highlighted.value = true
  await say(clips.letter(props.letter))
  highlighted.value = false
}

watch(() => props.letter.id, () => { highlighted.value = false })
</script>

<template>
  <button
    type="button"
    class="toy-press relative flex items-baseline justify-center rounded-blob font-black leading-none transition-colors duration-300"
    :class="[
      plain ? 'bg-white text-ink' : [theme.bg, theme.ink],
      size === 'hero' ? 'gap-[2vmin] px-[6vmin] py-[3vmin]' : 'size-full gap-1 p-2',
      highlighted && 'ring-8 ring-sunny',
    ]"
    :aria-label="`Letter ${letter.uppercase}`"
    @click="onTap"
  >
    <span
      class="block"
      :class="[size === 'hero' ? 'text-[min(40vw,26vh)] landscape:text-[min(26vw,40vh)]' : size === 'sample' ? 'text-[min(10vh,22vw)] landscape:text-[min(14vh,9vw)]' : 'text-[min(15vh,40vw)] sm:text-[min(19vw,22vh)] landscape:text-[min(19vw,32vh)]', animating && 'animate-bounce-soft']"
      @animationend="animating = false"
    >{{ letter.uppercase }}</span>
    <span v-if="showLowercase" class="block opacity-80" :class="size === 'hero' ? 'text-[min(24vw,15vh)] landscape:text-[min(15vw,24vh)]' : 'text-[min(12vw,8vh)]'">{{ letter.lowercase }}</span>
  </button>
</template>
