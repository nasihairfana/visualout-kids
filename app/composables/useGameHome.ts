/**
 * The home screen of the game the child is in, e.g. `/abc` for `/abc/find`.
 * Every game lives under its own path on kids.visualout.com, so game screens never send a
 * child back to the parent-facing Visualout Kids home page at `/`.
 */
export function useGameHome() {
  const route = useRoute()
  return computed(() => `/${route.path.split('/')[1] ?? ''}`)
}
