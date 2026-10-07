import {createSignal} from 'solid-js'
export function Counter(){const [count,set]=createSignal(0);return <button onClick={()=>set(n=>n+1)}>{count()}</button>}
