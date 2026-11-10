# Visualout Kids

Gentle, free learning games for toddlers, made by [Nasiha Irfana](https://github.com/nasihairfana), at
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
| **Write** | `/abc/write?letter=a` | Trace a big dotted capital with a finger. A glowing dot first shows how; a green start dot and arrow mark where each line begins. Each traced line snaps solid with a chime, and the finished letter pops in full colour with its picture and "You wrote A!". The eraser wipes it to try again, and the hand button shows how again. Starts at the first letter not yet written |
| **Webbo** | `/abc/web` | Webbo's Letter City, in 3D. First, "Do it with me!": Webbo shows its web move (wiggle your fingers… and point! Whoosh!) and a big hand invites the child to copy it. Then the camera stands behind Webbo on a rooftop, looking out over the city; three buildings ahead carry big letter signs. "Catch the letter B!": tap the right building (or swipe a web from Webbo to it); Webbo wiggles, points, webs the sign and jumps over in one gentle arc, the sign pops into its picture, and Webbo dances. After five, a finale: fireworks and a parade of the pictures caught. `?view=side` shows the original side-on view with balloons. Falls back to a flat version if the phone can't do 3D |
| **Letter Trails** | `/abc/trail` | Guide a friend home along a road map of letter tiles. "Follow the letter E!": tap the next E next to the bunny (or drag the bunny along), and it hops on; the trail turns gold until it reaches the carrots. Eight friends (bunny → carrots, bird → nest, puppy → doghouse, duckling → mother duck, cat → kitten, baby elephant → mother, butterfly → flower, child → parents) open up as stars are earned. Three ways to play: **Beginner** (one letter, one case, short trails), **Challenge** (more letters to tell apart, longer trails, then big A and little a together) and **Super Challenge** (letters in order, then spelling simple words). Each level gets a little harder. No timer; every finished level earns 3 stars |
| Parents | `/abc/parents` | Opened by **holding** the lock button on the game's home screen for 2 seconds. It has volume, auto-speak, device-voice fallback, music and progress reset. It also shows which letter shapes the child recognises, Letter Trails stars and levels, content status, privacy notes, and who makes Visualout Kids |

### Webbo's Letter City (3D)

Webbo is an original Visualout character, **not** Spider-Man (Marvel/Disney): keep the art free of
masks, suits, chest emblems and red-and-blue colouring. The design is in
[docs/plans/webbo-letter-city.md](docs/plans/webbo-letter-city.md).

- **Loaded only on `/abc/web`.** three.js (~140 KB gzipped) sits in its own file, so the other modes
  don't download it. The service worker still caches it for offline play.
- **Rules are shared.** `WebboGame.vue` uses `useChoiceActivity` exactly like Find the letter
  (wait-then-look, calm pause, hint, adaptive difficulty, mode `web` in progress). The 3D world only
  draws and animates.
- **Two views, one world.** `app/games/webbo/world.ts` (`WebboWorld`) holds everything shared: Webbo,
  hands and move, celebrations, confetti, tap buttons, swiping, the finale and the frame loop, plus
  the original side-on view. `rooftop.ts` (`RooftopWorld`, the default) only changes the city
  layout, the targets (signs instead of balloons), the camera and the jump. Portrait uses a wider
  lens and a zigzag of buildings so the three signs never overlap. The camera only ever glides
  forward: no rolling, spinning or upside-down swings.
- **Tapping.** Each balloon has a real, invisible `<button>` that the world keeps over it every frame:
  at least 88 px, reachable by keyboard and screen readers, and no 3D hit-testing needed. Older kids
  can also swipe from Webbo to a balloon to throw the web; letting go over a balloon picks it.
- **Playing with Webbo.** Kids want to see Webbo's face and move him. In the rooftop view, a
  sideways drag on Webbo turns him round; when he faces the child he waves, giggles and wiggles his
  legs, and he springs back when let go. A tap makes him hop, wave and giggle (in every view, and
  in the flat fallback). None of this is ever a pick, and it's off while he's jumping or dancing.
  Swipe-to-throw is kept exactly as kids know it: any drag heading up from Webbo throws a web, and
  a sideways drag that then heads up to a sign becomes a throw too. In the side view the balloons
  sit beside Webbo, so there every drag is a throw and only tapping makes him react.
- **Webbo's web move.** Two of Webbo's eight limbs are arms with mitten hands. Before every web it
  wiggles its fingers (like the Itsy Bitsy Spider) and points: a move toddlers can copy with their own
  hands. It's deliberately not Spider-Man's hand sign. The intro teaches it once per visit, and the
  hand button shows it again. No camera is used: copying it is pretend play.
- **Celebrations.** Every catch gets confetti and a dance with arms up; a first-try catch adds a spin
  and a second burst. After five balloons, fireworks and a parade of the five pictures play before
  the "Great swinging!" screen.
- **Gentle.** The camera glides slowly after Webbo; reduced-motion settings remove the bobbing and
  swinging. No timer, no way to lose.
- **Light.** Low-poly shapes, no real-time shadows, pixel ratio capped at 2 and dropped to 1 if the
  first few seconds run slowly. If WebGL isn't available, or the context is lost, `WebboFlat.vue`
  plays the same game in 2D.

### Letter Trails

- **One way through.** `app/games/trail/levels.ts` builds each level from a seed (difficulty +
  level number), so a level is always the same map. The trail is a random walk from the left edge to
  the goal on the right that never touches itself. The letters on it never appear anywhere else on the
  map, so there is exactly one right route.
- **Gently harder.** Beginner starts with 3×4 maps and one or two other letters; later levels add
  columns, longer trails and more letters to tell apart. Challenge mixes big and little letters
  (follow every A and a). Super Challenge follows letters in alphabet order (A, B, C, D), then
  spells short words (CAT, DOG, BALL).
- **Never a fail.** A wrong letter wobbles and says its name; the friend just stays put. The right
  letter further along lights up the next step instead. Two wrong taps in a row, or a 7-second
  pause, and the next tile glows. No timer, no score to lose: every finished level earns 3 stars,
  and stars open new friends (6, 12, 18 … 45).
- **Tap or drag.** Tap the next tile, or put a finger on the friend and drag it along the road; a drag
  only ever tries the tile right next to it. Tiles are real buttons for keyboards and screen readers.
- **Fits every screen.** On a tall phone the map turns on its side so tiles stay big (at least
  64 px on a 360 px-wide phone, at most 128 px on a desktop). The target card sits on top in portrait
  and on the side in landscape. The scenery stays behind the map, so letters are always easy to read.
- Progress (levels, stars, chosen friend) is kept on the device in `vk.abc.trail.v1`. Clear progress
  in Parent settings resets it.

### Writing for small fingers

Write is tuned for 2- and 3-year-olds (see `LetterTracer.vue`):

- **Wide path.** The finger only has to pass within about 13% of the letter's height of the line, and a
  quick swipe still counts, because the points in between are checked too.
- **Never wrong.** Scribbling off the line leaves crayon marks but no wiggle, buzzer or "try again".
  Starting in the wrong place just pulses the green start dot.
- **Lifting is fine.** Progress stays when the finger lifts, so a child can stop and carry on.
- **Help when stuck.** After 7 seconds without progress, the glowing dot shows the current line again.
- **Tuning.** `TOLERANCE`, `LOOKAHEAD` and `IDLE_MS` at the top of `LetterTracer.vue` are first guesses.
  Adjust them after watching a toddler use it on a real phone.

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
  games/webbo/world.ts         Webbo's 3D world (three.js): Webbo, animations, celebrations; side-on view
  games/webbo/rooftop.ts       Rooftop view (default): behind Webbo, letter signs on buildings ahead
  games/trail/levels.ts        Letter Trails level builder: seeded maps, one-way trails, difficulty ramp
  data/trail-themes.ts         Letter Trails friends and worlds: colours, scenery, stars to unlock
  data/letter-strokes.ts       How to write each capital: strokes in order, as SVG paths (used by Write)
  data/brand.ts                Who makes Visualout Kids, other Visualout products (MeqOS), the games list
  composables/
    useAudio.ts                Audio service: one speech channel, fallbacks, synthesized effects, music
    useSoundSettings.ts        Persisted parent sound settings (on-device only)
    useGameProgress.ts         Explored letters, first-try history, difficulty level (on-device only)
    useAlphabetGame.ts         Content access, round generation (avoids look-alike letters), round sessions
    useGameHome.ts             The current game's home path (e.g. /abc), for Home buttons
    useChoiceActivity.ts       Reusable "pick 1 of 3" engine: wait-then-look, calm pause, hints, no score
    useTrailProgress.ts        Letter Trails levels, stars and unlocked friends (on-device only)
  components/
    alphabet/                  AlphabetGameHome, AlphabetExplore, AlphabetCard, AlphabetNavigation,
                               LetterQuiz, LetterObjectMatch, ObjectIllustration,
                               AlphabetWrite, LetterTracer (tracing: checkpoints, crayon, show-me)
    webbo/                     WebboGame (rules and controls), WebboScene (hosts the 3D world),
                               WebboFlat (2D fallback), WebboIcon (flat Webbo)
    trail/                     TrailHome (friends and difficulty), TrailGame (rules), TrailBoard (map,
                               tap and drag), TrailSuccess, TrailScenery, TrailArt (placeholder art)
    game/                      Reusable across future games: AudioButton, GameFeedback, GameTopBar,
                               ParentGate, ParentSettings, RoundProgress, RoundReward, SoundToggle, AppIcon
    platform/                  MadeByVisualout (credit and outside links; parent-facing screens only)
  pages/index.vue              Visualout Kids home page (for parents)
  pages/abc/                   My First ABC: index, explore, find, match, write, web, trail, parents
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
- Speech is generated, not yet human-recorded, and all illustrations (including the Letter Trails
  friends) are placeholders. See [ASSETS.md](ASSETS.md).
- Usability testing with parents and children aged 2–3 is still to do.

## Support the project

Visualout Kids is free for every family: no ads, no purchases and no tracking, now and always.
It's built by one independent developer, and sponsors cover its running costs. If it helps your
family or classroom, you can [sponsor it on GitHub](https://github.com/sponsors/nasihairfana).

Sponsorship pays for:

- the AI coding and development tools used to build the games
- new games for numbers, colours and shapes, and better voices and illustrations (see [ASSETS.md](ASSETS.md))
- the hosting and domain that keep the app free to use

Sponsoring is optional and unlocks nothing: every game stays free and complete for everyone.

## Contributing

Bug reports, ideas and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and the
[code of conduct](CODE_OF_CONDUCT.md). Please report security or child-safety problems privately,
as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 Nasiha Irfana. This covers the code, the placeholder illustrations and the
generated speech in this repository.
