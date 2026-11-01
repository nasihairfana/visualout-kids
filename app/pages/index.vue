<script setup lang="ts">
import { brand, games } from '~/data/brand'

/**
 * Visualout Kids home page at kids.visualout.com. Written for parents: what this is, the games,
 * the privacy promise and who makes it. Children start inside a game (the installed app opens
 * straight into /abc), so this page is the only place outside Parent settings that links out.
 */
useHead({ title: 'Visualout Kids · Free learning games for toddlers' })

const promises = [
  { title: 'No ads, nothing to buy', text: 'No adverts, no in-app purchases, no upsells. Ever.', tone: 'bg-peach text-peach-ink' },
  { title: 'No accounts or tracking', text: 'No sign-up, no analytics, no cookies. Progress stays on your device.', tone: 'bg-mint text-mint-ink' },
  { title: 'Works offline', text: 'Install it once and play anywhere, even in airplane mode.', tone: 'bg-sky text-sky-ink' },
  { title: 'Made for tiny hands', text: 'Big buttons, no timers, no scores and no red crosses. Mistakes are just another try.', tone: 'bg-butter text-butter-ink' },
]

const year = new Date().getFullYear()
</script>

<template>
  <!-- A normal scrolling web page, unlike the game screens. -->
  <div class="h-dvh overflow-y-auto bg-cream select-text">
    <div class="mx-auto flex max-w-5xl flex-col gap-16 px-4 pb-10 pt-[max(env(safe-area-inset-top),1rem)] sm:px-8">
      <header class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <img src="/icons/icon.svg" alt="" width="44" height="44" class="size-11 rounded-xl shadow-sm">
          <span class="text-lg font-black tracking-tight">Visualout Kids</span>
        </div>
        <NuxtLink to="/abc" class="toy-press inline-flex min-h-12 items-center rounded-full bg-sunny px-5 font-black text-ink">
          Play
        </NuxtLink>
      </header>

      <section class="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
        <div class="flex flex-col gap-5">
          <p class="text-sm font-bold uppercase tracking-[0.2em] text-coral">Free · Private · Offline</p>
          <h1 class="text-[clamp(2.4rem,7vw,4.2rem)] font-black leading-[1.02] tracking-tight">
            Gentle learning games for little ones.
          </h1>
          <p class="max-w-xl text-lg text-ink-soft">
            Calm, beautiful games for toddlers, designed around how 2- and 3-year-olds really learn.
            No ads, no tracking, and nothing to buy.
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <NuxtLink to="/abc" class="toy-press inline-flex min-h-16 items-center gap-3 rounded-full bg-ink px-7 text-lg font-black text-cream">
              Play My First ABC
              <AppIcon name="next" class="size-6" />
            </NuxtLink>
            <a href="#who" class="inline-flex min-h-16 items-center px-3 font-bold text-ink-soft underline-offset-4 hover:underline">Who makes this?</a>
          </div>
        </div>

        <div class="relative mx-auto grid aspect-square w-full max-w-[15rem] grid-cols-2 gap-3 sm:max-w-sm sm:gap-4" aria-hidden="true">
          <span class="grid animate-float place-items-center rounded-blob bg-peach text-[clamp(3.5rem,12vw,7rem)] font-black text-peach-ink">A</span>
          <span class="mt-10 grid animate-float place-items-center rounded-blob bg-sky text-[clamp(3.5rem,12vw,7rem)] font-black text-sky-ink [animation-delay:-1s]">b</span>
          <span class="-mt-6 grid animate-float place-items-center rounded-blob bg-mint text-[clamp(3.5rem,12vw,7rem)] font-black text-mint-ink [animation-delay:-2s]">C</span>
          <span class="mt-4 grid animate-float place-items-center rounded-blob bg-lilac text-[clamp(3.5rem,12vw,7rem)] font-black text-lilac-ink [animation-delay:-3s]">d</span>
          <img src="/icons/icon.svg" alt="" width="64" height="64" class="absolute -right-2 -top-4 size-16 rotate-12 rounded-2xl shadow-lg">
        </div>
      </section>

      <section aria-labelledby="games" class="flex flex-col gap-5">
        <h2 id="games" class="text-3xl font-black tracking-tight">The games</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <NuxtLink
            v-for="game in games"
            :key="game.path"
            :to="game.path"
            class="toy-press group flex items-center gap-5 rounded-[2rem] bg-white p-5"
          >
            <img :src="game.icon" alt="" width="88" height="88" class="size-22 shrink-0 rounded-3xl">
            <span class="flex flex-col gap-1">
              <span class="text-xs font-bold uppercase tracking-[0.18em] text-coral">{{ game.ages }}</span>
              <span class="text-2xl font-black">{{ game.name }}</span>
              <span class="text-ink-soft">{{ game.blurb }}</span>
            </span>
          </NuxtLink>
          <div class="flex items-center gap-5 rounded-[2rem] border-2 border-dashed border-ink/15 p-5 text-ink-soft">
            <span class="grid size-22 shrink-0 place-items-center rounded-3xl bg-white/60 text-4xl font-black text-ink/25">+</span>
            <span class="flex flex-col gap-1">
              <span class="text-2xl font-black text-ink/60">More on the way</span>
              <span>New games appear here and in the installed app automatically.</span>
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="promise" class="flex flex-col gap-5">
        <h2 id="promise" class="text-3xl font-black tracking-tight">Our promise to parents</h2>
        <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <li v-for="p in promises" :key="p.title" class="flex flex-col gap-2 rounded-[2rem] p-5" :class="p.tone">
            <span class="text-lg font-black">{{ p.title }}</span>
            <span class="opacity-90">{{ p.text }}</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="install" class="grid gap-4 rounded-[2rem] bg-white p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-8">
        <img src="/icons/pwa-192x192.png" alt="" width="96" height="96" class="size-24 rounded-3xl shadow-md">
        <div class="flex flex-col gap-2">
          <h2 id="install" class="text-2xl font-black">Put it on your phone's home screen</h2>
          <p class="text-ink-soft">
            Open this page in Chrome on Android, tap the <b class="text-ink">⋮</b> menu, then <b class="text-ink">Install app</b>
            (or <b class="text-ink">Add to Home screen</b>). On iPhone, use Safari's <b class="text-ink">Share</b> button →
            <b class="text-ink">Add to Home Screen</b>. It opens straight into the game and works offline.
          </p>
        </div>
      </section>

      <section id="who" aria-labelledby="who-title" class="flex scroll-mt-6 flex-col gap-5 rounded-[2rem] bg-ink p-6 text-cream sm:p-10">
        <p class="text-sm font-bold uppercase tracking-[0.2em] text-sunny">A little about us</p>
        <h2 id="who-title" class="text-[clamp(2rem,5vw,3rem)] font-black leading-tight tracking-tight">Made with care by {{ brand.studio }}.</h2>
        <MadeByVisualout dark class="max-w-2xl" />
      </section>

      <footer class="flex flex-col gap-2 border-t border-ink/10 pt-6 text-sm text-ink-soft sm:flex-row sm:justify-between">
        <span>© {{ year }} {{ brand.studio }}. Open-source software.</span>
        <span>No cookies. No tracking. Questions? <a :href="`mailto:${brand.contactEmail}`" class="font-bold text-ink underline-offset-4 hover:underline">{{ brand.contactEmail }}</a></span>
      </footer>
    </div>
  </div>
</template>
