import {createRoot,createSignal,createMemo,createEffect,flush,OBSERVE} from 'solid-js'
import {graphSize,attribution} from 'solid-js/attribution'
let stop:(()=>void)|undefined
let retained:(()=>number)|undefined
const release=attribution.enable({graphGrowth:false})
;(window as any).probe={
 size:()=>graphSize(),
 dropped:()=>{createRoot(()=>{const [read]=createSignal(1);createMemo(read)})},
 subscribed:()=>{const [read]=createSignal(1);retained=read;createRoot(d=>{stop=d;createEffect(read,()=>{})});flush()},
 cleanup:()=>{stop?.();stop=undefined;retained=undefined;release()},
 supported:!!OBSERVE
}
