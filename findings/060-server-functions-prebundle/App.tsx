/// <reference types="vite/client" />
import { createSignal, Loading } from 'solid-js'
import { dynamic } from '@solidjs/web'
import { getPanel } from './server'

if (!import.meta.env.SSR) void import('./client-probe')

export default function App() {
  const [show, setShow] = createSignal(false)
  const Panel = dynamic(async () => {
    try {
      const panel = await getPanel()
      if (!import.meta.env.SSR) Object.assign(globalThis.prebundleProbe, { settled: true, value: typeof panel })
      return panel
    } catch (error) {
      if (!import.meta.env.SSR) Object.assign(globalThis.prebundleProbe, { settled: true, error: String(error) })
      throw error
    }
  })
  return <>
    <button id="mount-panel" onClick={() => setShow(true)}>Mount server panel</button>
    {show() ? <Loading fallback={<p id="waiting">Waiting</p>}><Panel /></Loading> : <p id="home">Home</p>}
  </>
}
