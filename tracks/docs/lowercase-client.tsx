import {OBSERVE} from 'solid-js'
import {hydrate,render} from '@solidjs/web'
import {Shape} from './lowercase-shape'
const capture=OBSERVE?.diagnostics.capture();let count=0
const query=new URL(location.href).searchParams
const stop=(query.has('hydrate')?hydrate:render)(()=> <Shape mode={query.get('mode')!} handler={()=>{count++}}/>,document.getElementById('root')!)
;(window as any).lowercase={inspect:()=>({count,attribute:document.querySelector('button')!.getAttribute('onclick'),events:capture?.events.filter(e=>e.code==='LOWERCASE_EVENT_ATTRIBUTE').map(e=>({kind:e.kind,severity:e.severity,data:e.data}))??[]}),stop(){stop();capture?.stop()}}
