<script setup lang="ts">
import type { NumberArtKind } from '~/data/number-games'
import type { TrailArtKind } from '~/data/trail-themes'

/**
 * Numbers & Counting art, in the same style as Letter Trails (pastel fills, ink outline, dot eyes)
 * and reusing its animals and scenery. PLACEHOLDER art: simple original shapes (see ASSETS.md).
 * `tint` recolours the things that come in colours: balloons, fish, cars, planets, carriages.
 */
const props = defineProps<{ kind: NumberArtKind, flip?: boolean, tint?: string }>()

const SHARED: TrailArtKind[] = ['bunny', 'butterfly', 'flower', 'duckling', 'cloud', 'sun', 'tree', 'bush', 'fence', 'barn', 'hay', 'reeds', 'rock', 'sunflower', 'mushroom']
const shared = computed(() => (SHARED as string[]).includes(props.kind) ? props.kind as TrailArtKind : null)
const INK = '#2B2240'
const c = computed(() => props.tint ?? '#FF8FA3')
</script>

<template>
  <TrailArt v-if="shared" :kind="shared" :flip="flip" />
  <svg v-else viewBox="0 0 100 100" aria-hidden="true" class="overflow-visible">
    <g :transform="flip ? 'translate(100 0) scale(-1 1)' : undefined" :stroke="INK" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <!-- ============ things to count ============ -->
      <template v-if="kind === 'apple'">
        <path d="M50 30c-10-8-34-6-34 22 0 24 18 40 34 34 16 6 34-10 34-34 0-28-24-30-34-22z" fill="#FF6B6B" />
        <path d="M50 30c0-8 2-14 6-18" fill="none" />
        <path d="M56 22c6-8 18-8 20-4-6 6-14 8-20 4z" fill="#69DB7C" />
        <ellipse cx="34" cy="46" rx="5" ry="8" fill="#fff" opacity=".5" stroke="none" />
      </template>
      <template v-else-if="kind === 'strawberry'">
        <path d="M50 92C28 78 16 56 22 40c6-12 50-12 56 0 6 16-6 38-28 52z" fill="#FF6B6B" />
        <path d="M30 34c6-4 12-2 20-8 8 6 14 4 20 8-6 6-14 4-20 2-6 2-14 4-20-2z" fill="#69DB7C" />
        <g fill="#FFE066" stroke="none"><circle cx="38" cy="50" r="2" /><circle cx="54" cy="48" r="2" /><circle cx="64" cy="58" r="2" /><circle cx="44" cy="64" r="2" /><circle cx="56" cy="72" r="2" /><circle cx="34" cy="62" r="2" /></g>
      </template>
      <template v-else-if="kind === 'carrot'">
        <path d="M40 30l24 0-8 62c-2 6-6 6-8 0z" fill="#FF922B" />
        <path d="M44 46h8M48 62h8M50 76h4" fill="none" />
        <path d="M52 30c-8-12-14-18-20-18 2 8 8 14 16 18M52 30c0-12 4-22 10-24 0 10-2 18-6 24M54 30c8-10 16-14 22-12-4 8-12 12-20 12" fill="#69DB7C" />
      </template>
      <template v-else-if="kind === 'egg'">
        <path d="M50 10C30 10 18 44 18 62c0 18 14 30 32 30s32-12 32-30C82 44 70 10 50 10z" fill="#FFF8EC" />
        <ellipse cx="38" cy="40" rx="5" ry="9" fill="#fff" stroke="none" />
      </template>
      <template v-else-if="kind === 'tomato'">
        <ellipse cx="50" cy="58" rx="36" ry="30" fill="#FF6B6B" />
        <path d="M50 30l-12-6 8 10-14 2 14 4M50 30l12-6-8 10 14 2-14 4" fill="#69DB7C" />
        <ellipse cx="34" cy="50" rx="6" ry="8" fill="#fff" opacity=".45" stroke="none" />
      </template>
      <template v-else-if="kind === 'pumpkin'">
        <ellipse cx="50" cy="60" rx="40" ry="30" fill="#FF922B" />
        <path d="M50 30c-10 10-10 50 0 60M50 30c10 10 10 50 0 60M28 36c-8 14-8 38 2 50M72 36c8 14 8 38-2 50" fill="none" />
        <path d="M48 32c0-8 2-14 8-18" fill="none" stroke-width="5" stroke="#5C940D" />
      </template>
      <template v-else-if="kind === 'pellet'">
        <circle cx="50" cy="54" r="26" fill="#E8A65A" />
        <circle cx="42" cy="46" r="5" fill="#C77A2C" stroke="none" /><circle cx="58" cy="60" r="4" fill="#C77A2C" stroke="none" /><circle cx="56" cy="44" r="3" fill="#C77A2C" stroke="none" />
      </template>
      <template v-else-if="kind === 'worm'">
        <path d="M14 66c10-20 22-20 26-4s16 16 22 0 18-18 26 0" fill="none" :stroke="INK" stroke-width="20" />
        <path d="M14 66c10-20 22-20 26-4s16 16 22 0 18-18 26 0" fill="none" stroke="#FF8FA3" stroke-width="15" />
        <circle cx="86" cy="58" r="2.6" :fill="INK" stroke="none" />
      </template>
      <template v-else-if="kind === 'candle'">
        <rect x="38" y="34" width="24" height="58" rx="5" :fill="tint ?? '#74C0FC'" />
        <path d="M38 48l24-8M38 64l24-8M38 80l24-8" fill="none" stroke="#fff" stroke-width="4" />
        <path d="M50 34v-6" fill="none" />
        <path d="M50 4c8 10 10 16 0 24-10-8-8-14 0-24z" fill="#FFD43B" />
      </template>
      <template v-else-if="kind === 'ladybug'">
        <ellipse cx="50" cy="58" rx="34" ry="30" fill="#FF6B6B" />
        <path d="M50 28v60" fill="none" />
        <circle cx="50" cy="28" r="14" :fill="INK" />
        <g :fill="INK" stroke="none"><circle cx="34" cy="50" r="6" /><circle cx="66" cy="50" r="6" /><circle cx="36" cy="72" r="5" /><circle cx="64" cy="72" r="5" /></g>
        <circle cx="45" cy="26" r="2.6" fill="#fff" stroke="none" /><circle cx="55" cy="26" r="2.6" fill="#fff" stroke="none" />
      </template>
      <template v-else-if="kind === 'star'">
        <path d="M50 8l11 25 27 3-20 18 6 27-24-14-24 14 6-27-20-18 27-3z" fill="#FFD43B" />
        <circle cx="42" cy="48" r="2.6" :fill="INK" stroke="none" /><circle cx="58" cy="48" r="2.6" :fill="INK" stroke="none" />
        <path d="M44 58q6 5 12 0" fill="none" />
      </template>
      <template v-else-if="kind === 'shell'">
        <path d="M50 20C24 20 14 50 18 74h64c4-24-6-54-32-54z" fill="#FFC9D6" />
        <path d="M50 20v54M34 26l-6 48M66 26l6 48" fill="none" />
        <rect x="30" y="72" width="40" height="12" rx="6" fill="#FFC9D6" />
      </template>

      <!-- ============ characters and places ============ -->
      <template v-else-if="kind === 'farmer'">
        <rect x="28" y="56" width="44" height="38" rx="12" fill="#74C0FC" />
        <path d="M36 56v-6M64 56v-6" fill="none" />
        <rect x="38" y="62" width="24" height="16" rx="4" fill="#4DABF7" />
        <circle cx="50" cy="40" r="18" fill="#FFD8A8" />
        <path d="M22 28h56M32 28c0-14 8-20 18-20s18 6 18 20" fill="#FFE066" />
        <circle cx="44" cy="40" r="2.6" :fill="INK" stroke="none" /><circle cx="56" cy="40" r="2.6" :fill="INK" stroke="none" />
        <ellipse cx="40" cy="47" rx="3.5" ry="2" fill="#FF9BB3" opacity=".7" stroke="none" /><ellipse cx="60" cy="47" rx="3.5" ry="2" fill="#FF9BB3" opacity=".7" stroke="none" />
        <path d="M44 50q6 5 12 0" fill="none" />
      </template>
      <template v-else-if="kind === 'bigfish'">
        <path d="M18 50L2 30v40z" fill="#FFA94D" />
        <ellipse cx="52" cy="50" rx="40" ry="32" fill="#FFC078" />
        <path d="M44 20c6-10 18-12 22-6-8 2-14 6-18 12" fill="#FFA94D" />
        <path d="M30 40c6 6 6 14 0 20" fill="none" />
        <circle cx="68" cy="40" r="7" fill="#fff" /><circle cx="70" cy="40" r="3.6" :fill="INK" stroke="none" />
        <ellipse cx="84" cy="58" rx="7" ry="9" fill="#C2410C" />
        <ellipse cx="62" cy="58" rx="4" ry="2.4" fill="#FF9BB3" opacity=".8" stroke="none" />
      </template>
      <template v-else-if="kind === 'fish'">
        <path d="M22 50L6 34v32z" :fill="c" />
        <ellipse cx="54" cy="50" rx="34" ry="24" :fill="c" />
        <ellipse cx="54" cy="50" rx="34" ry="24" fill="#fff" opacity=".25" stroke="none" />
        <circle cx="72" cy="44" r="4" :fill="INK" stroke="none" /><circle cx="73" cy="43" r="1.3" fill="#fff" stroke="none" />
        <path d="M80 56q4 2 6-2" fill="none" />
      </template>
      <template v-else-if="kind === 'cake'">
        <rect x="12" y="52" width="76" height="36" rx="8" fill="#FFC9D6" />
        <path d="M12 62c8 8 12 8 19 0s12 8 19 0 12 8 19 0 12 8 19 0" fill="#fff" />
        <rect x="6" y="86" width="88" height="8" rx="4" fill="#E9ECEF" />
        <g fill="#FFD43B" stroke="none"><circle cx="26" cy="76" r="3" /><circle cx="50" cy="78" r="3" /><circle cx="74" cy="76" r="3" /></g>
      </template>
      <template v-else-if="kind === 'basket'">
        <path d="M24 46c0-30 52-30 52 0" fill="none" stroke-width="5" stroke="#B8763E" />
        <path d="M10 44h80l-10 46H20z" fill="#E8A65A" />
        <path d="M14 60h72M18 76h64M34 44l4 46M50 44v46M66 44l-4 46" fill="none" stroke="#B8763E" />
        <rect x="6" y="38" width="88" height="10" rx="5" fill="#D08B44" />
      </template>
      <template v-else-if="kind === 'frog'">
        <ellipse cx="50" cy="66" rx="34" ry="24" fill="#69DB7C" />
        <ellipse cx="50" cy="72" rx="20" ry="13" fill="#D3F9D8" stroke="none" />
        <circle cx="34" cy="40" r="12" fill="#69DB7C" /><circle cx="66" cy="40" r="12" fill="#69DB7C" />
        <circle cx="34" cy="40" r="5" :fill="INK" stroke="none" /><circle cx="66" cy="40" r="5" :fill="INK" stroke="none" />
        <circle cx="35.5" cy="38.5" r="1.6" fill="#fff" stroke="none" /><circle cx="67.5" cy="38.5" r="1.6" fill="#fff" stroke="none" />
        <path d="M36 60q14 10 28 0" fill="none" />
        <ellipse cx="28" cy="62" rx="4" ry="2.4" fill="#FF9BB3" opacity=".7" stroke="none" /><ellipse cx="72" cy="62" rx="4" ry="2.4" fill="#FF9BB3" opacity=".7" stroke="none" />
        <path d="M18 86c4-6 10-6 14 0M68 86c4-6 10-6 14 0" fill="#51CF66" />
      </template>
      <template v-else-if="kind === 'lilypad'">
        <path d="M50 54L50 14A40 34 0 1 1 30 21z" fill="#8CE99A" transform="translate(0 6)" />
        <path d="M50 60L74 40M50 60L24 44M50 60l6 30" fill="none" stroke="#51CF66" />
      </template>
      <template v-else-if="kind === 'balloon'">
        <path d="M50 74q-4 10 2 24" fill="none" stroke-width="1.8" />
        <path d="M50 6C28 6 16 22 16 40c0 20 18 34 34 36 16-2 34-16 34-36C84 22 72 6 50 6z" :fill="c" />
        <path d="M46 76h8l-4 5z" :fill="c" />
        <ellipse cx="34" cy="28" rx="6" ry="10" fill="#fff" opacity=".55" stroke="none" transform="rotate(-20 34 28)" />
      </template>
      <template v-else-if="kind === 'engine'">
        <rect x="8" y="40" width="56" height="34" rx="6" :fill="tint ?? '#FF6B6B'" />
        <rect x="44" y="16" width="34" height="58" rx="6" :fill="tint ?? '#FF6B6B'" />
        <rect x="50" y="24" width="22" height="18" rx="4" fill="#D0EBFF" />
        <rect x="14" y="20" width="12" height="20" rx="3" fill="#495057" />
        <path d="M6 18c4-8 14-8 16-14 6 4 14 2 18 8" fill="#fff" stroke="#CED4DA" />
        <path d="M78 74l14 0 0-14z" fill="#FFD43B" />
        <circle cx="24" cy="80" r="11" fill="#495057" /><circle cx="60" cy="80" r="11" fill="#495057" />
        <circle cx="24" cy="80" r="4" fill="#ADB5BD" stroke="none" /><circle cx="60" cy="80" r="4" fill="#ADB5BD" stroke="none" />
      </template>
      <template v-else-if="kind === 'carriage'">
        <rect x="6" y="28" width="88" height="48" rx="8" :fill="tint ?? '#74C0FC'" />
        <circle cx="26" cy="82" r="10" fill="#495057" /><circle cx="74" cy="82" r="10" fill="#495057" />
        <circle cx="26" cy="82" r="3.6" fill="#ADB5BD" stroke="none" /><circle cx="74" cy="82" r="3.6" fill="#ADB5BD" stroke="none" />
      </template>
      <template v-else-if="kind === 'car'">
        <path d="M10 62c0-8 4-12 12-14l12-18c2-3 4-4 8-4h20c4 0 6 1 8 4l10 18c10 2 12 6 12 14v10H10z" :fill="c" />
        <path d="M38 30h12v18H28zM56 30h10l10 18H56z" fill="#D0EBFF" />
        <circle cx="28" cy="74" r="11" fill="#495057" /><circle cx="72" cy="74" r="11" fill="#495057" />
        <circle cx="28" cy="74" r="4" fill="#ADB5BD" stroke="none" /><circle cx="72" cy="74" r="4" fill="#ADB5BD" stroke="none" />
        <rect x="84" y="56" width="6" height="6" rx="2" fill="#FFE066" />
      </template>
      <template v-else-if="kind === 'rocket'">
        <path d="M50 4c18 14 22 40 16 66H34C28 44 32 18 50 4z" fill="#F1F3F5" />
        <path d="M34 54L18 72l2 12 14-10zM66 54l16 18-2 12-14-10z" fill="#FF6B6B" />
        <circle cx="50" cy="38" r="9" fill="#74C0FC" />
        <path d="M40 70c2 14 6 22 10 26 4-4 8-12 10-26z" fill="#FFD43B" />
        <path d="M44 70c2 8 4 13 6 16 2-3 4-8 6-16z" fill="#FF922B" stroke="none" />
        <path d="M44 6c4-2 8-2 12 0" fill="none" />
      </template>
      <template v-else-if="kind === 'planet'">
        <circle cx="50" cy="50" r="32" :fill="tint ?? '#B197FC'" />
        <ellipse cx="50" cy="54" rx="48" ry="12" fill="none" stroke-width="5" stroke="#FFE066" transform="rotate(-12 50 54)" />
        <circle cx="38" cy="38" r="5" fill="#fff" opacity=".35" stroke="none" />
      </template>
      <template v-else-if="kind === 'bear'">
        <circle cx="26" cy="26" r="12" fill="#C08457" /><circle cx="74" cy="26" r="12" fill="#C08457" />
        <ellipse cx="50" cy="76" rx="30" ry="22" fill="#C08457" />
        <circle cx="50" cy="44" r="28" fill="#C08457" />
        <ellipse cx="50" cy="54" rx="13" ry="10" fill="#F1D3B3" stroke="none" />
        <path d="M44 50h12l-6 5z" :fill="INK" />
        <circle cx="40" cy="40" r="3.2" :fill="INK" stroke="none" /><circle cx="60" cy="40" r="3.2" :fill="INK" stroke="none" />
        <ellipse cx="32" cy="52" rx="4" ry="2.4" fill="#FF9BB3" opacity=".7" stroke="none" /><ellipse cx="68" cy="52" rx="4" ry="2.4" fill="#FF9BB3" opacity=".7" stroke="none" />
        <path d="M34 18l16-14 16 14z" fill="#FFD43B" />
        <circle cx="50" cy="4" r="3" fill="#FF8FA3" />
      </template>
      <template v-else-if="kind === 'hen'">
        <ellipse cx="48" cy="62" rx="32" ry="26" fill="#F8F9FA" />
        <circle cx="66" cy="38" r="16" fill="#F8F9FA" />
        <path d="M60 22c2-8 8-8 8-2 2-6 8-4 6 4" fill="#FF6B6B" />
        <path d="M80 38l10 4-10 4z" fill="#FFB84D" />
        <circle cx="70" cy="36" r="2.8" :fill="INK" stroke="none" />
        <path d="M26 56c8 6 18 6 24 0" fill="none" />
        <path d="M40 86v8M56 86v8" fill="none" stroke="#F59F00" />
      </template>

      <!-- ============ scenery ============ -->
      <template v-else-if="kind === 'seaweed'">
        <path d="M30 98c-10-20 10-30 0-50s10-30 4-44M54 98c8-18-8-28 2-46s-6-30 2-40M72 98c-6-14 8-22 0-36" fill="none" stroke="#2F9E44" stroke-width="7" />
      </template>
      <template v-else-if="kind === 'bubble'">
        <circle cx="40" cy="60" r="20" fill="#fff" fill-opacity=".25" stroke="#fff" />
        <circle cx="70" cy="30" r="12" fill="#fff" fill-opacity=".25" stroke="#fff" />
        <circle cx="34" cy="54" r="4" fill="#fff" stroke="none" />
      </template>
      <template v-else-if="kind === 'coral'">
        <path d="M50 96V60M50 70c-14-6-20-20-18-34M50 64c12-6 18-18 16-32M38 50c-8 0-12-6-14-12M64 46c8-2 10-8 12-14" fill="none" stroke="#FF8FA3" stroke-width="8" />
      </template>
      <template v-else-if="kind === 'moon'">
        <path d="M60 10a40 40 0 1 0 30 60A32 32 0 0 1 60 10z" fill="#FFF3BF" />
        <circle cx="40" cy="50" r="5" fill="#FFE066" stroke="none" /><circle cx="52" cy="72" r="4" fill="#FFE066" stroke="none" />
      </template>
      <template v-else-if="kind === 'twinkle'">
        <path d="M50 14l6 30 30 6-30 6-6 30-6-30-30-6 30-6z" fill="#FFF3BF" stroke="none" />
      </template>
      <template v-else-if="kind === 'gift'">
        <rect x="16" y="40" width="68" height="52" rx="6" fill="#B197FC" />
        <rect x="10" y="30" width="80" height="16" rx="5" fill="#9775FA" />
        <path d="M50 30v62" fill="none" stroke="#FFD43B" stroke-width="8" />
        <path d="M50 30c-10-16-26-16-22-4 2 6 12 6 22 4zM50 30c10-16 26-16 22-4-2 6-12 6-22 4z" fill="#FFD43B" />
      </template>
      <template v-else-if="kind === 'bunting'">
        <path d="M0 20q50 20 100 0" fill="none" />
        <path d="M6 23l10 24 8-21z" fill="#FF8FA3" /><path d="M30 28l8 24 10-22z" fill="#FFD43B" /><path d="M54 29l8 24 10-24z" fill="#74C0FC" /><path d="M78 25l8 22 8-24z" fill="#8CE99A" />
      </template>
      <template v-else-if="kind === 'house'">
        <rect x="18" y="44" width="64" height="50" rx="4" :fill="tint ?? '#FFE8CC'" />
        <path d="M10 48L50 12l40 36z" fill="#FF8787" />
        <rect x="42" y="66" width="16" height="28" rx="3" fill="#B8763E" />
        <rect x="24" y="56" width="12" height="12" rx="2" fill="#D0EBFF" /><rect x="64" y="56" width="12" height="12" rx="2" fill="#D0EBFF" />
      </template>
    </g>
  </svg>
</template>
