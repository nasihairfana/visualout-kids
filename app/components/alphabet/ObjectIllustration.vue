<script setup lang="ts">
import type { AlphabetLetter } from '~/types/learning'

/**
 * Shows the letter's object artwork from `assets.illustration`, falling back to the
 * letter's emoji if the file is missing or fails to load.
 */
const props = defineProps<{ letter: AlphabetLetter, size?: 'xs' | 'sm' | 'md' | 'lg' }>()

const failed = ref(false)
watch(() => props.letter.id, () => { failed.value = false })

const src = computed(() => (failed.value ? null : props.letter.assets.illustration))
const sizeClass = computed(() => ({
  xs: 'size-6 text-lg',
  sm: 'size-20 text-[4rem]',
  md: 'size-28 text-[5.5rem] sm:size-36 sm:text-[7rem]',
  lg: 'size-[min(58vw,30vh)] text-[min(40vw,21vh)] landscape:size-[min(36vw,46vh)] landscape:text-[min(26vw,32vh)]',
}[props.size ?? 'lg']))
</script>

<template>
  <div class="grid place-items-center" :class="sizeClass" role="img" :aria-label="letter.word">
    <img v-if="src" :src="src" :alt="letter.word" class="size-full object-contain drop-shadow-md" draggable="false" @error="failed = true">
    <span v-else class="emoji drop-shadow-md" aria-hidden="true">{{ letter.fallbackEmoji }}</span>
  </div>
</template>
