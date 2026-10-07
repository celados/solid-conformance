import {OBSERVE} from 'solid-js'
import {renderToString,isDev} from '@solidjs/web'
export function sample(symbol:boolean){const value=symbol?Symbol('unrenderable'):{bad:true};const capture=OBSERVE?.diagnostics.capture();const warn=console.warn;console.warn=()=>{};try{const html=renderToString(()=><div>{value as any}</div>);return{warned:capture?.events.filter(e=>e.code==='UNRECOGNIZED_INSERT_VALUE').length??0,html,dev:isDev}}finally{capture?.stop();console.warn=warn}}
