import { action, createSignal, latest, Loading, Show } from 'solid-js'
import { render } from '@solidjs/web'
let release!: () => void
const held = new Promise<void>(resolve => {release = resolve})
function App() {
 const [n, setN] = createSignal(0)
 const save = action(function* () {setN(1); yield held})
 return <><button onClick={() => void save()}>save</button><i>{n()}</i><Show when={latest(n) > 0}><Loading fallback="pending"><p>{n()}</p></Loading></Show></>
}
render(() => <App />, document.getElementById('app')!)
declare global {var releaseMount: () => void}
window.releaseMount = () => release()
