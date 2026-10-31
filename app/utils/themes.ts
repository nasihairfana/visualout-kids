import type { CardTheme } from '~/types/learning'

/** Pastel surface + dark ink pairs. Every ink/bg pair is above 7:1 contrast (WCAG AAA). */
export const THEME_CLASSES: Record<CardTheme, { bg: string, ink: string, soft: string }> = {
  peach: { bg: 'bg-peach', ink: 'text-peach-ink', soft: 'bg-peach/60' },
  mint: { bg: 'bg-mint', ink: 'text-mint-ink', soft: 'bg-mint/60' },
  sky: { bg: 'bg-sky', ink: 'text-sky-ink', soft: 'bg-sky/60' },
  lilac: { bg: 'bg-lilac', ink: 'text-lilac-ink', soft: 'bg-lilac/60' },
  butter: { bg: 'bg-butter', ink: 'text-butter-ink', soft: 'bg-butter/60' },
  rose: { bg: 'bg-rose', ink: 'text-rose-ink', soft: 'bg-rose/60' },
}

export const themeOf = (theme: CardTheme) => THEME_CLASSES[theme]
