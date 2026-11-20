import { createMemo, createSignal, Loading, Show } from 'solid-js'
import { render } from '@solidjs/web'

function Pane(props: { name: string }) {
  const [request, setRequest] = createSignal(0)
  let resolve!: (value: number) => void
  const value = createMemo(() => request() === 0 ? 0 : new Promise<number>(done => { resolve = done }))
  return <section id={props.name}>
    <button onClick={() => setRequest(1)}>request</button>
    <button onClick={() => resolve(1)}>resolve</button>
    <Loading fallback="loading"><Show when={value()} fallback="idle">done</Show></Loading>
  </section>
}

render(() => <><Pane name="left"/><Pane name="right"/></>, document.getElementById('app')!)
