import {createSignal,createOptimistic} from 'solid-js'
import {renderToString} from '@solidjs/web'
export function sample(optimistic:boolean){let updaters=0;const warn=console.warn;console.warn=()=>{};try{const html=renderToString(()=>{const[read,set]=optimistic?createOptimistic(0):createSignal(0);set(n=>{updaters++;return n+1});return String(read())});return{html,updaters}}finally{console.warn=warn}}
