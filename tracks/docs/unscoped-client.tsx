import {OBSERVE} from 'solid-js'
import {hydrate} from '@solidjs/web'
import {Shape,Solo,HydratedNegatives} from './unscoped-shape'
const capture=OBSERVE?.diagnostics.capture();let clicked=0
const dispose=hydrate(()=>new URL(location.href).searchParams.has('negatives')?<HydratedNegatives clicked={()=>clicked++}/>:new URL(location.href).searchParams.has('solo')?<Solo clicked={()=>clicked++}/>:<Shape bad={new URL(location.href).searchParams.get('bad')==='true'} clicked={()=>clicked++}/>,document.getElementById('root')!)
;(window as any).inspect=()=>({clicked,events:capture?.events.filter(e=>e.code==='UNSCOPED_HOLE_ALLOCATED_IDS').map(e=>({kind:e.kind,severity:e.severity,data:e.data}))??[]})
;(window as any).stop=()=>{capture?.stop();dispose()}
