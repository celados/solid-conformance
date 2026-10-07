import { OBSERVE, createRoot, createMemo, untrack } from 'solid-js'
import { attribution } from 'solid-js/attribution'

const capture = OBSERVE?.diagnostics.capture()
const release = attribution.enable({ fanOut: 1, hotRuns: false, hotTime: false, wideDeps: false, waterfalls: false })
let dispose!: () => void
let reader!: () => number
createRoot(close => {
  dispose = close
  const source = createMemo(() => Promise.resolve(1), { loadingValue: 0, name: 'source' })
  reader = createMemo(source, { name: 'reader' })
})
;(window as any).result = new Promise(resolve => setTimeout(() => {
  const warnings = capture?.events.filter(event => event.code === 'HUGE_FAN_OUT') ?? []
  resolve({ value: untrack(reader), warnings: warnings.map(event => event.data?.write),
    causes: attribution.history('rerun').filter(event => event.nodeName === 'reader').flatMap(event => event.causes.map(cause => cause.kind)) })
  dispose()
  capture?.stop()
  release()
}, 20))
