import { createRoot, createSignal, createMemo, action, flush } from 'solid-js'
import { attribution } from 'solid-js/attribution'
export async function run(){
 const release=attribution.enable({log:false,checks:false});let dispose!:()=>void
 try{
  const mutate=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);createMemo(r);return action(async function*(){await Promise.resolve();w(1);yield})})
  await mutate();flush()
  return attribution.history('rerun').at(-1)?.causes[0]?.origin?.kind
 }finally{dispose();release()}
}
