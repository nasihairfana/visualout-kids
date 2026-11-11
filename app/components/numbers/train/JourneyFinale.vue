<script setup lang="ts">
import type { NumberGame } from '~/data/number-games'
import type { PassengerKind } from '~/games/numbers/journey'

/**
 * End of the Number Train journey, at Party Station: the three stations with their stars, the
 * total, Bunny and the passengers celebrating, any adventure that just opened, and play again.
 */
defineProps<{ stations: string[], stars: number, passengers: PassengerKind[], unlocked: NumberGame[] }>()
const emit = defineEmits<{ replay: [], home: [] }>()
const FRIENDS = { rabbit: 'bunny', bear: 'bear', duck: 'duckling', cat: 'cat' } as const
</script>

<template>
  <div class="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-ink/25 p-4" role="dialog" aria-modal="true" aria-label="We made it!">
    <div class="grid w-full max-w-lg animate-pop gap-3 rounded-[2rem] bg-cream p-5 text-center shadow-2xl landscape:max-w-3xl landscape:grid-cols-2 landscape:items-center landscape:gap-4 landscape:py-3">
      <div class="flex flex-col items-center gap-3 landscape:gap-2">
        <!-- Bunny and the passengers, celebrating -->
        <div class="flex items-end justify-center gap-1" aria-hidden="true">
          <TrailArt kind="bunny" class="size-20 animate-bounce-soft [animation-iteration-count:infinite] landscape:size-14" />
          <template v-for="(p, i) in passengers.slice(0, 6)" :key="i">
            <TrailArt v-if="p !== 'bear'" :kind="FRIENDS[p] as 'bunny' | 'duckling' | 'cat'" class="size-12 animate-bounce-soft [animation-iteration-count:infinite] landscape:size-10" :style="{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }" />
            <NumberArt v-else kind="bear" class="size-12 animate-bounce-soft [animation-iteration-count:infinite] landscape:size-10" :style="{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }" />
          </template>
        </div>

        <p class="text-3xl font-black tracking-tight text-ink sm:text-4xl">We made it!</p>

        <p class="flex items-center gap-2 text-2xl font-black text-ink" data-total-stars>
          <AppIcon name="star" class="size-10 text-sunny drop-shadow" />{{ stars }} stars
        </p>

        <div class="flex items-center gap-5">
          <button type="button" class="toy-press grid size-24 place-items-center rounded-full bg-sunny text-ink landscape:size-20" aria-label="Play the journey again" @click="emit('replay')">
            <AppIcon name="replay" class="size-12" />
          </button>
          <button type="button" class="toy-press grid size-20 place-items-center rounded-full bg-white text-ink landscape:size-16" aria-label="All the adventures" @click="emit('home')">
            <AppIcon name="home" class="size-10" />
          </button>
        </div>
      </div>

      <div class="flex flex-col items-center gap-2">
        <!-- The whole journey -->
        <ol class="flex w-full flex-col gap-2" aria-label="The journey">
          <li v-for="(name, i) in stations" :key="name" class="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-left shadow-sm">
            <span class="grid size-9 shrink-0 place-items-center rounded-full bg-sunny text-lg font-black text-ink">{{ i + 1 }}</span>
            <span class="min-w-0 flex-1 text-sm font-black leading-tight text-ink">{{ name }}</span>
            <span class="flex shrink-0" aria-label="3 stars"><AppIcon v-for="n in 3" :key="n" name="star" class="size-5 text-sunny" /></span>
          </li>
        </ol>

        <div v-if="unlocked.length" class="flex w-full flex-col items-center gap-1 rounded-2xl bg-white px-3 py-2 shadow-md" data-unlocked>
          <span class="font-black text-ink">{{ unlocked.length > 1 ? 'New adventures!' : 'New adventure!' }}</span>
          <span class="flex flex-wrap justify-center gap-x-3 gap-y-1">
            <span v-for="g in unlocked" :key="g.id" class="flex items-center gap-1 text-sm font-bold text-ink-soft">
              <NumberArt :kind="g.hero" class="size-8" tint="#FF8FA3" />{{ g.title }}
            </span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
