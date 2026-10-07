import { createRoot, createSignal, flush, untrack } from 'solid-js'
export function run() {
 let dispose!:()=>void
 const state=createRoot(d=>{dispose=d;const [source,setSource]=createSignal(1);const [card,setCard]=createSignal<{n:number,pinned:boolean}>(previous=>previous?.pinned?previous:{n:source(),pinned:false});return{setSource,card,setCard}})
 state.setCard({n:99,pinned:true});state.setSource(2);flush()
 state.setCard({n:99,pinned:false});state.setSource(3);flush()
 const result=untrack(state.card);dispose();return result
}
