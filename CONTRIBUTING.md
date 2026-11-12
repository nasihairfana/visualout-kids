# Contributing to Visualout Kids

Thanks for helping! Visualout Kids makes free learning games for children aged 2–3. Bug reports,
ideas from parents, and pull requests are all welcome.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run generate     # the production build, as deployed
```

See the [README](README.md) for how the project is laid out and how each game works.

## House rules

These protect the children who use the app. Pull requests that break them can't be merged.

- **No tracking.** No analytics, ads, trackers, cookies or calls to outside services. Data stays on
  the device.
- **No way out for children.** Child screens never link out of the app. Outside links belong only on
  parent-facing screens (the home page at `/` and Parent settings behind the hold gate).
- **Never a fail.** No timers, scores, losing, buzzers or red "wrong" states.
- **Original characters only.** Webbo is an original Visualout character, not Spider-Man: no masks,
  suits, chest emblems or red-and-blue colouring. Don't add art or audio you don't have the rights to.
- **Big and gentle.** Touch targets of at least 64 px, and respect `prefers-reduced-motion`.
- **One natural voice.** Everything the app says is a recording in the same voice. New spoken text
  goes in the pack data (`app/data/english-alphabets.ts` or `english-numbers.ts`) as a whole
  sentence, never a word to be joined to others, and is voiced with `npm run audio` in the **same**
  pull request. `npm run generate` refuses to build while any line has no recording, because
  the device voice it would fall back to sounds robotic next to the rest.

## Pull requests

- Keep each pull request to one change, and say what you tested (ideally on a real phone).
- Run `npm run typecheck` and `npm run check:audio` before opening it.
- Update the README when behaviour changes.

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE).

Please follow our [code of conduct](CODE_OF_CONDUCT.md).
