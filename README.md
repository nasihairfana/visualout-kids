# Visualout Kids

Gentle, free learning games for toddlers, by [Visualout](https://www.visualout.com), at
**[kids.visualout.com](https://kids.visualout.com)**. The first game is **My First ABC**, an A–Z
alphabet game for children aged 2–3, at [`/abc`](https://kids.visualout.com/abc).

| Path | For | What it is |
|---|---|---|
| `/` | Parents | The Visualout Kids home page: the games, the privacy promise, how to install, and who makes it |
| `/abc` | Children | My First ABC. Each future game gets its own path next to it |

The site installs as one app, **Visualout Kids**, which opens straight into `/abc`. Children never
land on the home page from inside a game: every Home button goes back to the game's own home.

It's built with Nuxt 4, Vue 3 (`<script setup lang="ts">`), TypeScript and Tailwind CSS v4. It's an
installable PWA that works offline.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run generate     # static build + service worker in .output/public
npx serve .output/public   # or any static host
```

To install it on Android, open the deployed site in Chrome and choose **Add to Home screen** or
**Install app**. Once installed, it runs fully offline.

## Deploy (Cloudflare Pages)

The game is hosted on Cloudflare Pages, connected to this GitHub repo. Every push to `main`
publishes the game, and every pull request gets its own preview link.

One-time setup in the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**,
pick this repo, then use these settings:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run generate` |
| Build output directory | `.output/public` |
| Node version | Read from `.node-version` (22) |

Then add a custom domain under **Custom domains** (for example `abc.visualout.com`). Keep that
address for good: an installed app is tied to it, and a Play Store release later needs a domain
you own. Leave Cloudflare Web Analytics **off**.

`npm run generate` also runs `scripts/postbuild.mjs`. It gives each game's pages their own title and
link-preview tags, because WhatsApp and Facebook read the HTML without running the app. It also
writes `.output/public/_headers`, which contains:

- **A strict Content-Security-Policy.** It only allows the app's own files, so nothing can load
  from or send data to another site. The two inline scripts Nuxt adds to each page are allowed by
  their exact hash, which is recalculated on every build.
- **No camera, microphone or location access.** The policy also stops the app being shown inside
  other sites (no framing) and sends no referrer to anyone.
- **Caching rules.** `sw.js` and the manifest are never cached for long, so updates reach families.
  Hashed build files are cached forever.

`public/_redirects` sends the old root addresses (`/find`, `/match`, …) to their new home under `/abc`.

After the first deploy, check offline mode on an Android phone: install the app, switch on
airplane mode, then relaunch it.

## What's in the game

| Mode | Route | How it plays |
|---|---|---|
| **Explore** | `/abc/explore?letter=a` | Shows one big letter (upper and lower case), a picture and the word. Tapping the letter says it, and tapping the picture says the word. You can use the big arrows or swipe. The A–Z grid button is for grown-ups. Going past Z shows "Great exploring!" |
| **Find the letter** | `/abc/find` | Asks "Where is A?", shows an A in a frame, and offers 3 big letters. All cards are plain white, so the twin can only be found by its shape, not its colour. There's no score, timer or red. Each session is 5 rounds and ends with a celebration |
| **Match** | `/abc/match` | Shows a letter and 3 pictures, and asks "Which one starts with A?" It follows the same rules as Find the letter |
| Parents | `/abc/parents` | Opened by **holding** the lock button on the game's home screen for 2 seconds. It has volume, auto-speak, device-voice fallback, music and progress reset. It also shows which letter shapes the child recognises, content status, privacy notes, and who makes Visualout Kids |

### Looking, not guessing

With 3 choices and unlimited tries, tapping at random always wins in the end. Find the letter and
Match are built so that looking pays off and guessing doesn't (see `useChoiceActivity.ts`):

- **Wait, then look.** The choices are dimmed for the first second of each round, and while the question
  is being asked, and the letter to find glows. A tap during the wait does nothing except bounce that letter.
- **Calm pause for guesses.** A wrong tap within 0.8 s of the choices waking up counts as a guess. The
  choices settle, the letter to find pulses, and the voice says "Look carefully!" before asking again.
- **Wrong taps teach.** The tapped letter names itself ("That's M."), then the question repeats.
- **Bigger reward for really looking.** Finding the answer on the first or second try gives a burst of
  stars and "Wonderful!". After two misses the answer glows as a hint, and finding it then gives one star
  and "You found it!". It's still warm, never a fail.
- **Difficulty adapts.** Find the letter starts with very different shapes (A, O, S). When most recent
  rounds are right first time, it moves to mixed letters, then to rounds with a look-alike (E with F,
  B with P). If the child starts guessing again, it steps back down.
- **Honest progress.** A letter only counts as recognised after 3 first-try picks in a row. This is
  stored on the device only and shown in Parent settings.

## Project structure

```
app/
  types/learning.ts            Language-agnostic content model (AlphabetPack, AlphabetLetter, SpokenClip)
  data/english-alphabets.ts    English A–Z content, phrases, asset registration ← edit content here
  data/brand.ts                Who makes Visualout Kids, other Visualout products (MeqOS), the games list
  composables/
    useAudio.ts                Audio service: one speech channel, fallbacks, synthesized effects, music
    useSoundSettings.ts        Persisted parent sound settings (on-device only)
    useGameProgress.ts         Explored letters, first-try history, difficulty level (on-device only)
    useAlphabetGame.ts         Content access, round generation (avoids look-alike letters), round sessions
    useGameHome.ts             The current game's home path (e.g. /abc), for Home buttons
    useChoiceActivity.ts       Reusable "pick 1 of 3" engine: wait-then-look, calm pause, hints, no score
  components/
    alphabet/                  AlphabetGameHome, AlphabetExplore, AlphabetCard, AlphabetNavigation,
                               LetterQuiz, LetterObjectMatch, ObjectIllustration
    game/                      Reusable across future games: AudioButton, GameFeedback, GameTopBar,
                               ParentGate, ParentSettings, RoundProgress, RoundReward, SoundToggle, AppIcon
    platform/                  MadeByVisualout (credit and outside links; parent-facing screens only)
  pages/index.vue              Visualout Kids home page (for parents)
  pages/abc/                   My First ABC: index, explore, find, match, parents
scripts/postbuild.mjs          After each build: per-game link-preview tags, Cloudflare Pages headers
scripts/make-og-images.mjs     Renders the link-preview images in public/og (run by hand after changes)
scripts/generate-audio.mjs     `npm run audio`: voices every clip offline with Kokoro, writes the audio manifest
public/
  illustrations/               26 placeholder SVGs (see ASSETS.md)
  audio/en/…                   Generated speech clips (see ASSETS.md)
  icons/                       App icons
```

### Adding another game

1. Put its pages under `app/pages/<game>/` (for example `app/pages/numbers/`).
2. Add it to `games` in `app/data/brand.ts`, so it appears on the home page.
3. Add its link-preview details to `GAME_PAGES` in `scripts/postbuild.mjs`, and its image to
   `scripts/make-og-images.mjs`.

### Adding another language later

1. Add `app/data/<lang>-alphabets.ts` that exports an `AlphabetPack`.
2. Pass it to `useAlphabetGame(pack)`. Today it defaults to English. A language picker in Parent
   settings would be the only new UI.
3. Put its recordings in `public/audio/<lang>/`.

The components never hard-code letters, words or phrases.

## Audio behaviour

- Only one voice clip plays at a time. New speech always stops the previous clip.
- The fallback order is: **local recording → on-device system voice (if a parent allows it) → silence.**
  The shipped clips are generated ahead of time (`npm run audio`), so the app never calls an online
  TTS API. For the device voice it only uses voices that report `localService`, skips novelty voices
  and prefers warm, high-quality ones (Samantha, Ava, Karen, "Enhanced"/"Natural" variants…).
  On Android, the system default is the on-device TTS engine.
- The tap, success, try-again and celebrate sounds are synthesized with Web Audio, so they need no
  files. The "try again" sound is a warm rising tone, never a buzzer.
- Sound only plays in response to a tap: a tap on a button, or the tap that started a round.
  Audio stops when the app goes to the background.
- Background music is supported but **off by default**, and no track ships yet.

## Child safety & privacy

The app has no login, ads, purchases, analytics, trackers, notifications or social features.
Nothing a child can tap leads out of the app. Links to Visualout, MeqOS and the source code appear
only on the parents' home page and in Parent settings, behind the press-and-hold gate. This follows
the parental-gate rule in kids' app policies such as Google Play's Families policy. Those links
carry `?ref=kids` so Visualout's own sites can count visits from here, and nothing in this app
tracks anyone. The only data stored is sound preferences, explored letter ids and whether each letter was
recently picked right first time, kept in `localStorage` on the device. Parents can clear it. Parent settings sit behind a press-and-hold gate,
away from the game controls.

## Accessibility & touch

- Every primary control is at least 64 px. The main controls are 80–96 px.
- Letter ink on pastel backgrounds is high contrast. Correct and wrong states use motion, size and
  voice as well as colour.
- The app turns off pull-to-refresh, page scrolling during play, long-press menus and image
  dragging. Only the Parents page scrolls.
- It respects `prefers-reduced-motion`.
- Layouts adapt to portrait phones, landscape phones and tablets.

## Known gaps before release

- **Offline install not yet verified on a real device.** The build precaches every file (234
  entries, 2.5 MB, including all routes, illustrations and speech clips), but the dev sandbox couldn't run a service worker.
  Check this on an Android phone: install → airplane mode → relaunch.
- Speech is generated, not yet human-recorded, and all illustrations are placeholders. See [ASSETS.md](ASSETS.md).
- Usability testing with parents and children aged 2–3 is still to do.

## License

Open source. Add the Visualout Kids license of choice (e.g. MIT for code, CC BY for artwork) before publishing.
