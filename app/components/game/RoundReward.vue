<script setup lang="ts">
import type { Celebration } from '~/composables/useChoiceActivity'

/**
 * Shown under a solved round: stars and the big Next button.
 * A pick made without the hint gets a burst of stars; one made with the hint gets a single,
 * smaller star — still warm, never a "fail", just less fanfare than really looking.
 */
defineProps<{ celebration: Celebration }>()
defineEmits<{ next: [] }>()
</script>

<template>
  <div class="flex items-center gap-4">
    <div v-if="celebration === 'big'" class="flex items-end" aria-hidden="true">
      <AppIcon name="star" class="size-10 animate-pop text-sunny drop-shadow [animation-delay:120ms] [animation-fill-mode:both]" />
      <AppIcon name="star" class="size-16 animate-pop text-sunny drop-shadow" />
      <AppIcon name="star" class="size-10 animate-pop text-sunny drop-shadow [animation-delay:240ms] [animation-fill-mode:both]" />
    </div>
    <AppIcon v-else name="star" class="size-11 animate-pop text-sunny drop-shadow" aria-hidden="true" />
    <button type="button" class="toy-press grid size-24 place-items-center rounded-full bg-sunny text-ink" aria-label="Next" @click="$emit('next')">
      <AppIcon name="next" class="size-12 animate-nudge" />
    </button>
  </div>
</template>
