import {OBSERVE} from 'solid-js'
import {renderToString} from '@solidjs/web'
import {Shape,NegativeShapes} from './unscoped-shape'
export function page(bad:boolean){const capture=OBSERVE?.diagnostics.capture();const warn=console.warn;console.warn=()=>{};try{const html=renderToString(()=><Shape bad={bad} clicked={()=>{}}/>);return{html,events:capture?.events.filter(e=>e.code==='UNSCOPED_HOLE_ALLOCATED_IDS').map(e=>({kind:e.kind,severity:e.severity,data:e.data}))??[]}}finally{capture?.stop();console.warn=warn}}
export function negatives(){const capture=OBSERVE?.diagnostics.capture();try{renderToString(NegativeShapes);return capture?.events.filter(e=>e.code==='UNSCOPED_HOLE_ALLOCATED_IDS').length??0}finally{capture?.stop()}}

export {generateHydrationScript} from '@solidjs/web'
