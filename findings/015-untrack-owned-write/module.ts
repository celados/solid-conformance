import { createRoot, createSignal, untrack } from 'solid-js'
export function run() {
 let dispose!:()=>void
 let error:unknown
 try {createRoot(d=>{dispose=d;const [,write]=createSignal(0);untrack(()=>write(1))})}
 catch(value){error=value instanceof Error?value.message:String(value)}
 finally {dispose?.()}
 return error
}
