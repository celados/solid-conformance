import { OBSERVE, createMemo, createRoot, createSignal, untrack } from 'solid-js'

async function sample(indirect: boolean) {
  const capture = OBSERVE?.diagnostics.capture()
  let dispose!: () => void
  let value!: () => number
  createRoot(close => {
    dispose = close
    const [read] = createSignal(1)
    async function load() {
      await Promise.resolve()
      return read()
    }
    value = indirect ? createMemo(() => load()) : createMemo(async () => {
      await Promise.resolve()
      return read()
    })
  })
  await new Promise(resolve => setTimeout(resolve, 20))
  const result = {
    value: untrack(value),
    warnings: capture?.events.filter(event => event.code === 'UNTRACKED_READ_AFTER_AWAIT').length ?? 0,
  }
  dispose()
  capture?.stop()
  return result
}
;(window as any).result = (async () => ({ direct: await sample(false), helper: await sample(true) }))()
