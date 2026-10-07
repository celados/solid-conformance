import {lazy,Loading,OBSERVE} from 'solid-js'
import {renderToStream,generateHydrationScript,isDev} from '@solidjs/web'
import Part from './late-part'
export async function page(){const capture=OBSERVE?.diagnostics.capture(),warn=console.warn;console.warn=()=>{};try{const Lazy=lazy(async()=>({default:Part}));const html=await renderToStream(()=> <Loading fallback='loading'><Lazy/></Loading>,{manifest:{}});return{html:generateHydrationScript()+'<div id="root">'+html+'</div>',events:capture?.events.filter(e=>e.code==='LAZY_ASSET_UNMAPPED').map(e=>({kind:e.kind,severity:e.severity,data:e.data}))??[],dev:isDev}}finally{capture?.stop();console.warn=warn}}
