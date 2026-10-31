<script setup lang="ts">
import type { SpokenClip } from '~/types/learning'

/** Big round "listen" button. Pass a clip (or clips) to play, or listen for @press. */
const props = withDefaults(defineProps<{
  clip?: SpokenClip | SpokenClip[]
  label: string
  size?: 'md' | 'lg'
  tone?: string
}>(), { size: 'lg', tone: 'bg-white text-ink' })

const emit = defineEmits<{ press: [] }>()
const { say, effect } = useAudio()
const active = ref(false)

async function onPress() {
  emit('press')
  if (!props.clip) return
  effect('tap')
  active.value = true
  await say(props.clip)
  active.value = false
}
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    class="toy-press grid shrink-0 place-items-center rounded-full"
    :class="[tone, size === 'lg' ? 'size-20 sm:size-24' : 'size-16', active && 'animate-glow']"
    @click="onPress"
  >
    <AppIcon name="speaker" :class="size === 'lg' ? 'size-10 sm:size-12' : 'size-8'" />
    <slot />
  </button>
</template>
