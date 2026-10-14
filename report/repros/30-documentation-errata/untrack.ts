import { createRoot, createSignal, untrack } from 'solid-js'

export function untrackWrite() {
  let dispose: (() => void) | undefined
  try {
    createRoot(cleanup => {
      dispose = cleanup
      const [, setN] = createSignal(0)
      untrack(() => setN(1))
    })
  } finally {dispose?.()}
}

export function ownedWriteControl() {
  createRoot(dispose => {
    try {
      const [, setN] = createSignal(0, {ownedWrite: true})
      untrack(() => setN(1))
    } finally {dispose()}
  })
}
