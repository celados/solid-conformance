import { createSignal, createMemo, Loading } from 'solid-js'

let resolveFirst!: (value: number) => void
const first = new Promise<number>(resolve => { resolveFirst = resolve })
const replacement = new Promise<number>(() => {})

export function App() {
  const [id, setId] = createSignal(0)
  const data = createMemo(() => id() === 0 ? first : replacement)
  const control = new URL(location.href).searchParams.has('control')
  return <>
    <button onClick={() => resolveFirst(1)}>Resolve first</button>
    <button onClick={() => setId(1)}>Replace</button>
    {control
      ? <Loading on={id()} fallback="pending"><p>{data()}</p></Loading>
      : <Loading on={() => { id(); return 1 }} fallback="pending"><p>{data()}</p></Loading>}
  </>
}
