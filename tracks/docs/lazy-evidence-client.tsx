import {lazy,Loading} from 'solid-js'
import {hydrate} from '@solidjs/web'
let started=false,completed=false
const address='/late-part.js'
const Part=lazy(async()=>{started=true;const result=await import(address);completed=true;return result})
const stop=hydrate(()=> <Loading fallback='loading'><Part/></Loading>,document.getElementById('root')!)
;(window as any).lazyEvidence={inspect:()=>({started,completed,text:document.getElementById('root')!.textContent}),stop}
