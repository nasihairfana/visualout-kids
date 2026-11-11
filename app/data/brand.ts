/**
 * Who is behind Visualout Kids. Shown only on parent-facing screens: the home page at `/`
 * and Parent settings (behind the hold gate). Child screens show the name, never links.
 *
 * Outgoing links carry `?ref=kids` so Visualout's own sites can count visits from here.
 * Nothing in Visualout Kids itself tracks anyone.
 */
export interface BrandProduct {
  name: string
  /** One line a parent understands at a glance. */
  tagline: string
  url: string
}

export const brand = {
  studio: 'Visualout',
  studioUrl: 'https://www.visualout.com/?ref=kids',
  siteUrl: 'https://kids.visualout.com',
  sourceUrl: 'https://github.com/nasihairfana/visualout-kids',
  contactEmail: 'team@visualout.com',
  /** Other Visualout products, mentioned to parents on parent-facing screens only. */
  products: [
    {
      name: 'MeqOS',
      tagline: 'Run your service business in one place: jobs, stock, invoices and payments.',
      url: 'https://meqos.app/?ref=kids',
    },
  ] as BrandProduct[],
}

/** Games on the Visualout Kids home page. */
export const games = [
  {
    path: '/abc',
    name: 'My First ABC',
    ages: 'Ages 2–3',
    blurb: 'Meet all 26 letters: hear them, find them by shape, and match them to pictures.',
    icon: '/icons/icon.svg',
  },
  {
    path: '/numbers',
    name: 'Numbers & Counting',
    ages: 'Ages 2–5',
    blurb: 'Eleven little adventures: count apples, feed the fish, pop balloons, fill the number train and more.',
    icon: '/icons/numbers.svg',
  },
]
