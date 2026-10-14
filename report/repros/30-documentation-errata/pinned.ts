import { createRoot, createSignal, flush, untrack } from 'solid-js'

export function pinnedDerivation(readSourceUnconditionally = false) {
  let dispose!: () => void
  const state = createRoot(cleanup => {
    dispose = cleanup
    const [source, setSource] = createSignal(1)
    const [card, setCard] = createSignal<{n: number; pinned: boolean}>(prev => {
      const n = readSourceUnconditionally ? source() : undefined
      return prev?.pinned ? prev : {n: n ?? source(), pinned: false}
    })
    return {setSource, card, setCard}
  })
  try {
    state.setCard({n: 99, pinned: true}); state.setSource(2); flush()
    state.setCard({n: 99, pinned: false}); state.setSource(3); flush()
    return untrack(state.card)
  } finally {dispose()}
}
