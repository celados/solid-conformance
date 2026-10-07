import { OBSERVE, createRoot, createSignal, onSettled } from 'solid-js'
export async function run() {
 const capture=OBSERVE!.diagnostics.capture()
 let dispose!:()=>void
 createRoot(d=>{dispose=d;onSettled(()=>{try {createSignal(0)} catch { /* The documented dev throw is contained so the test can inspect its event. */ }})})
 await new Promise(resolve=>setTimeout(resolve,0))
 dispose()
 return capture.stop().map(event=>event.code)
}
