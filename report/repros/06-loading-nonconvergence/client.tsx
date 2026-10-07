import { createSignal, createMemo, latest, Loading, flush, untrack } from 'solid-js'
import { render } from '@solidjs/web'

const tick = () => new Promise(resolve => setTimeout(resolve, 20))
async function sample(ahead: boolean) {
  const target = document.createElement('div')
  let change!: (value: number) => void
  let settle!: (value: number) => void
  let source!: () => number
  let warm!: (value:number)=>void
  const first = new Promise<number>(resolve=>{warm=resolve})
  const pending = new Promise<number>(resolve => { settle = resolve })
  const dispose = render(() => {
    const [id, set] = createSignal(0)
    change = set
    const data = createMemo(() => id() ? pending : first)
    source=data
    return <><Loading on={ahead ? latest(id) : id()} fallback='A'><span>{data()}</span></Loading><Loading fallback="B"><b>{data()}</b></Loading></>
  }, target)
  try {
    warm(1)
    await tick()
    const initial = target.textContent
    change(1)
    flush()
    await tick()
    const waiting = target.textContent
    settle(2)
    for(let i=0;i<30;i++) await tick()
    flush()
    return { initial, waiting, final: target.textContent, source: untrack(source) }
  } finally { dispose() }
}
;(window as any).result = (async () => ({ normal: await sample(false), latest: await sample(true) }))()
