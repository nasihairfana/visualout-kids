# My First ABC — assets to supply

The game ships with generated speech and placeholder artwork. This file lists exactly
what is still a placeholder and where real files go. **Nothing in the code points at a file
that doesn't exist**: a path is only switched on once it is listed in
`app/data/audio-manifest.json`, which `npm run audio` writes from what is on disk.

## Current status

| Asset | Status | What the app does meanwhile |
|---|---|---|
| Letter recordings (26) | **Generated** (Kokoro `af_heart`) | Can be replaced by human recordings at any time |
| Word recordings (26) | **Generated** | Same as above |
| Phrase recordings (257: instructions, praise, Write, Webbo and Letter Trails) | **Generated** | Same as above |
| Object sounds (optional) | **Missing** | No sound. These are optional extras |
| Background music (optional) | **Missing** | The toggle is disabled in Parent settings |
| Illustrations (26) | **Placeholder SVGs** in `public/illustrations/` | Simple stand-in drawings. If a file fails to load, an emoji is shown instead |
| Interaction sounds (tap, success, try-again, celebrate) | **Done** | Generated live with the Web Audio API, so no files are needed |
| Webbo (3D model and flat icon) | **Placeholder**, built from simple shapes in `app/games/webbo/world.ts` and `WebboIcon.vue` | Works as is. Final art should keep Webbo an original character: no mask, suit, chest emblem or red-and-blue look |
| Letter Trails friends and scenery | **Placeholder** SVG drawings in `app/components/trail/TrailArt.vue` | Works as is. Replace one `kind` at a time; keep the 100×100 view box and the soft ink outline |
| Numbers & Counting art | **Placeholder** SVG drawings in `app/components/numbers/NumberArt.vue` (it reuses the Letter Trails animals and scenery), and for the Number Train Adventure in `app/components/numbers/train/` (the train, Bunny the driver and the passengers in `JourneyTrain.vue`, the stations in `JourneyWorld.vue`) | Works as is. Replace one `kind` at a time; keep the 100×100 view box. Balloons, fish, cars, planets and candles take a `tint` |
| Numbers & Counting speech (283 clips) | **Generated** | Same as above |
| App icons | Done (first pass) | `public/icons/icon.svg`. Re-run `npx pwa-assets-generator` after changing it |

## Audio

Format: **MP3, mono, 44.1 kHz, about 96 kbps** for human recordings (generated clips are mono
24 kHz, 64 kbps: the voice model's own rate, and a third smaller to precache). Trim the silence at
both ends (leave about 50 ms), normalise to about −16 LUFS, and keep each clip under 2 seconds where
you can. Use one warm, friendly adult voice for everything, and speak slowly and clearly.

### 1. Letter names: `public/audio/en/letters/{id}.mp3`

`a.mp3` … `z.mp3`. Say the **letter name** ("ay", "bee", "see"), not the phonics sound.
(A phonics pack can be added later as its own data set.)

### 2. Words: `public/audio/en/words/{word-slug}.mp3`

```
apple ball cat dog elephant fish goat house ice-cream juice kite lion mango
nest orange parrot queen rabbit sun tiger umbrella van watermelon xylophone yo-yo zebra
```

### 3. Phrases: `public/audio/en/phrases/{name}.mp3`

| File | Text |
|---|---|
| `where-is-{id}.mp3` (26) | "Where is A?" |
| `which-starts-with-{id}.mp3` (26) | "A. Which one starts with A?" |
| `{id}-is-for.mp3` (26) | "A is for Apple!" |
| `thats-{id}.mp3` (26) | "That's A." Said when a wrong letter is tapped |
| `wonderful.mp3` | "Wonderful!" |
| `well-done.mp3` | "Yay! Well done!" |
| `you-found-it.mp3` | "You found it!" Softer praise, used after the hint |
| `look-carefully.mp3` | "Look carefully!" Said gently, after a too-quick guess |
| `try-again.mp3` | "Let's try again!" |
| `almost.mp3` | "Almost! Try another one." |
| `great-exploring.mp3` | "Great exploring!" |
| `great-finding.mp3` | "Great finding!" |
| `great-matching.mp3` | "Great matching!" |
| `lets-write-{id}.mp3` (26) | "Let's write A!" Said when a letter appears in Write |
| `you-wrote-{id}.mp3` (26) | "You wrote A!" Said when the child finishes tracing it |
| `great-writing.mp3` | "Great writing!" |
| `catch-the-letter-{id}.mp3` (26) | "Catch the letter A!" Webbo's question |
| `great-swinging.mp3` | "Great swinging!" After Webbo's fifth balloon |
| `wiggle-and-point.mp3` | "Wiggle your fingers… and point! Whoosh!" Webbo's web move, said playfully so the child copies it |
| `follow-the-letter-{id}.mp3` (26) | "Follow the letter A!" Letter Trails, one letter |
| `big-and-little-{id}.mp3` (26) | "Find big A and little A!" Letter Trails, mixed case |
| `follow-the-letters.mp3` | "Follow the letters in order!" Letter Trails, alphabet order (the letters are then said one by one) |
| `lets-spell.mp3` | "Let's spell!" Letter Trails, words (then the letters and the word) |
| `found-the-way.mp3` | "Hooray! You found the way!" End of a Letter Trails level |
| `arrival-{theme}.mp3` (8) | "Bunny found the carrots!" The friend's line at the goal, from `arrival` in `app/data/trail-themes.ts` |

Numbers & Counting (`app/data/english-numbers.ts`) adds, in the same folder:

| File | Text |
|---|---|
| `number-{n}.mp3` (0–30) | "seven!" Said with a little lift, as when counting out loud, and when a number is tapped |
| `numbers-{ask}-{n}.mp3` | Each game's instruction as **one sentence**: `numbers-pop-balloon-7` "Pop the balloon with seven!", also `catch-fish` and `fly-to` (1–30), `collect` "Collect seven!" (1–15), `feed-the-fish` and `candles` "Put seven candles on the cake!" (1–10) |
| `numbers-thats-{n}.mp3` (0–30) | "That's seven." Said calmly after a wrong pick |
| `number-plain-{n}.mp3` (1–20) | "Seven," The first number of a sum, said plainly |
| `numbers-and-{n}.mp3` (1–9), `numbers-add-more-{n}.mp3` (1–5), `numbers-take-away-{n}.mp3` (1–8) | "and two." "now add two more!" "take away two." The middle of a sum |
| `numbers-makes-{n}.mp3` (2–15), `numbers-leaves-{n}.mp3` (1–14) | "That makes five!" "That leaves three!" The end of a sum |
| `numbers-how-many.mp3`, `numbers-which-more.mp3`, `numbers-which-less.mp3`, `numbers-which-is-missing.mp3`, `numbers-what-comes-next.mp3` | Questions |
| `numbers-in-order.mp3`, `numbers-count-back.mp3`, `numbers-count-by-twos.mp3`, `numbers-jump.mp3`, `numbers-match-them.mp3`, `numbers-park-them.mp3`, `numbers-count-together.mp3` | Instructions |
| `numbers-thats-more.mp3`, `numbers-thats-less.mp3` | Gentle feedback after a wrong pick |
| `numbers-well-done.mp3`, `numbers-yay.mp3`, `numbers-great-counting.mp3`, `numbers-all-aboard.mp3`, `numbers-yum.mp3`, `numbers-happy-birthday.mp3` | Cheers |
| `numbers-number-valley.mp3`, `numbers-missing-bridge.mp3`, `numbers-animal-station.mp3`, `numbers-party-station.mp3`, `numbers-next-stop.mp3`, `numbers-great-job.mp3` | Number Train Adventure: arriving at each station, setting off, and after each station |

A line is never pieced together from single words: a word voiced on its own ("and", "makes",
"Pop the balloon with") gets its own falling, end-of-sentence tune, and sounds robotic next to the
next clip. So a sum is two or three short phrases, each with its number in it: "Three," "and two."
"That makes five!". The full list, with exact texts, comes from `numbersAudioCatalog()`, and the
ranges cover every round the games can make (`npm run check:audio` samples them to make sure).

### 4. Object sounds (optional): `public/audio/en/objects/{word-slug}.mp3`

These are short, gentle and never startling: a crunch for apple, a soft "meow" for cat, a bounce
for ball, a soft "baa" for goat. Use a **gentle purr, not a roar** for the lion and tiger. Keep them
under 1.5 seconds. They only play after the word, when the child taps the picture.

### 5. Background music (optional): `public/audio/music/{name}.mp3`

Use a soft loop of 30 to 60 seconds with no lyrics. Set `backgroundMusic` in the pack. Music
stays **off by default**, and a parent has to turn it on.

### Generated speech (`npm run audio`)

`ffmpeg-static` (which the script uses to trim and encode clips) is an **optional** dependency. It
downloads ffmpeg from GitHub during `npm install`, and the site's build must not fail when that
download does, so a failed download is skipped. The script then uses `FFMPEG_PATH`, or an `ffmpeg`
on the PATH (e.g. `brew install ffmpeg`). `npm rebuild ffmpeg-static` tries the download again.

`scripts/generate-audio.mjs` voices every letter, word and phrase with
[Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), an open (Apache-2.0) neural TTS model that runs
on your machine. Nothing is sent online and the app itself never calls a TTS service. Voice
`af_heart` at 0.9× speed. Each clip is trimmed, gently compressed, brought to −16 LUFS under a peak
limiter and saved as mono 24 kHz 64 kbps MP3.

```sh
npm run audio                # voice anything missing, then rewrite the manifest
npm run audio -- --force     # re-voice clips the script made before (after changing the voice or text)
npm run audio -- --scan      # just rescan public/audio and rewrite the manifest
npm run audio -- --phonemes  # show how the model will read every clip; lists any letter it misreads
npm run check:audio          # fail if anything the app says has no recording (run by `npm run generate`)
```

The first run downloads the model (about 330 MB) to the Hugging Face cache. The clip list comes from
`audioCatalog()` in `app/data/english-alphabets.ts`, so a new phrase there is picked up
automatically. If the model mispronounces something, give it a respelling: a letter in
`ENGINE_LETTER` in `english-alphabets.ts` (the model reads a lone "A" as the article "uh", so it is
fed "Eh": "Find big Eh and little Eh!"). Only the recording changes; the text on screen and the
device voice keep the real letter. Run `--phonemes` after any new phrase with a letter in it.

`npm run generate` (the production build) runs `check:audio` first and stops if a line has no
recording, so nothing unvoiced reaches the live site.

### Replacing with human recordings

Copy the file over the generated one at the same path, then run `npm run audio -- --scan`.
The manifest's `generated` map stores a hash of every file the script made. A file you replace no
longer matches, so it drops out of that map and is never overwritten, even with `--force`.

The service worker precaches everything in `public/audio`, so recordings work offline after the
next install or update. If a registered file is missing or broken, the app logs nothing to the
child. It falls back to the device voice and doesn't request that file again during the session.
(A network error, or a clip cut short by the next tap, is not counted as broken.)

## Illustrations: `public/illustrations/{word-slug}.svg`

All 26 files exist as **placeholders**. Each one starts with a `PLACEHOLDER` comment. To replace one:

1. Overwrite the file, keeping the same name. SVG is preferred. For WebP or PNG, change the
   extension in `assetsFor()`.
2. Use a square canvas, put the object centred with about 8% padding, and use a transparent
   background. The card colour comes from the theme.
3. Keep each file under 30 KB for fast loading on low-end Android devices.
4. Add the letter id to `FINAL_ART` so Parent settings reports it as final.
