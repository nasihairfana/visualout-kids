/**
 * Drag something onto a drop target, or just tap it: the same handler does both, so a child who
 * taps and a child who drags both get there. Drop targets are elements with `data-drop="key"`.
 *
 *   <button class="touch-none" @pointerdown="drag.start($event, item)" @click="drag.keyboard($event, item)">
 *   <div v-if="drag.ghost.item" class="fixed pointer-events-none" :style="drag.ghostStyle.value">…</div>
 *
 * A move under 10 px counts as a tap (small fingers wobble).
 */
export function useDragDrop<T>(opts: { onTap: (item: T) => void, onDrop: (item: T, target: string | null) => void }) {
  const ghost = shallowReactive({ item: null as T | null, x: 0, y: 0, w: 0, h: 0, over: null as string | null })
  let active: { id: number, cleanup: () => void } | null = null

  const targetAt = (x: number, y: number) =>
    (document.elementFromPoint(x, y)?.closest('[data-drop]') as HTMLElement | null)?.dataset.drop ?? null

  function start(e: PointerEvent, item: T) {
    if (active || (e.pointerType === 'mouse' && e.button !== 0)) return
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const sx = e.clientX
    const sy = e.clientY
    let moved = false
    try { el.setPointerCapture(e.pointerId) }
    catch { /* synthetic events */ }

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 10) {
        moved = true
        Object.assign(ghost, { item, w: rect.width, h: rect.height })
      }
      if (!moved) return
      ghost.x = ev.clientX - rect.width / 2
      ghost.y = ev.clientY - rect.height / 2
      ghost.over = targetAt(ev.clientX, ev.clientY)
    }
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return
      finish()
      if (!moved) return opts.onTap(item)
      const target = targetAt(ev.clientX, ev.clientY)
      ghost.item = null
      ghost.over = null
      opts.onDrop(item, target)
    }
    const cancel = () => {
      finish()
      ghost.item = null
      ghost.over = null
    }
    function finish() {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', cancel)
      active = null
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', cancel)
    active = { id: e.pointerId, cleanup: cancel }
  }

  /** Keyboard / screen reader activation (pointer clicks are already handled by `start`). */
  function keyboard(e: MouseEvent, item: T) {
    if (e.detail === 0) opts.onTap(item)
  }

  const ghostStyle = computed(() => ({ left: `${ghost.x}px`, top: `${ghost.y}px`, width: `${ghost.w}px`, height: `${ghost.h}px` }))
  onBeforeUnmount(() => active?.cleanup())
  return { start, keyboard, ghost, ghostStyle }
}
