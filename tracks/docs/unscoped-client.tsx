import {OBSERVE} from 'solid-js'
import {hydrate} from '@solidjs/web'
import {Shape} from './unscoped-shape'
const capture=OBSERVE?.diagnostics.capture();let clicked=0
const dispose=hydrate(()=><Shape bad={new URL(location.href).searchParams.get('bad')==='true'} clicked={()=>clicked++}/>,document.getElementById('root')!)
;(window as any).inspect=()=>({clicked,events:capture?.events.filter(e=>e.code==='UNSCOPED_HOLE_ALLOCATED_IDS').map(e=>({kind:e.kind,severity:e.severity,data:e.data}))??[]})
;(window as any).stop=()=>{capture?.stop();dispose()}
