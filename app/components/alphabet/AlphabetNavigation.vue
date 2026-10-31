<script setup lang="ts">
import type { AlphabetLetter } from '~/types/learning'

/** A–Z grid in a bottom sheet, for parents and older toddlers. Kept off the main screen. */
const props = defineProps<{ open: boolean, currentId: string }>()
const emit = defineEmits<{ select: [letter: AlphabetLetter], close: [] }>()

const { letters } = useAlphabetGame()
const { exploredSet } = useGameProgress()
</script>

<template>
  <Transition
    enter-from-class="translate-y-full" enter-active-class="transition-transform duration-300 ease-out"
    leave-to-class="translate-y-full" leave-active-class="transition-transform duration-200 ease-in"
  >
    <div v-if="props.open" class="fixed inset-x-0 bottom-0 z-30 max-h-[80dvh] overflow-y-auto rounded-t-[2rem] bg-white p-4 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-2xl" role="dialog" aria-label="All letters">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-2xl font-black text-ink">A – Z</span>
        <button type="button" class="toy-press grid size-16 place-items-center rounded-full bg-cream" aria-label="Close" @click="emit('close')">
          <AppIcon name="close" class="size-7" />
        </button>
      </div>
      <div class="grid grid-cols-5 gap-3 sm:grid-cols-7 md:grid-cols-9">
        <button
          v-for="l in letters"
          :key="l.id"
          type="button"
          class="toy-press relative grid aspect-square min-h-16 place-items-center rounded-2xl text-4xl font-black"
          :class="[themeOf(l.theme).bg, themeOf(l.theme).ink, l.id === currentId && 'ring-4 ring-ink']"
          :aria-label="`${l.uppercase} for ${l.word}`"
          :aria-current="l.id === currentId ? 'true' : undefined"
          @click="emit('select', l)"
        >
          {{ l.uppercase }}
          <span v-if="exploredSet.has(l.id)" class="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-ink/40" aria-hidden="true" />
        </button>
      </div>
    </div>
  </Transition>
  <div v-if="props.open" class="fixed inset-0 z-20 bg-ink/20" aria-hidden="true" @click="emit('close')" />
</template>
