import {Hydration,NoHydration,renderToStream,renderToString,generateHydrationScript} from '@solidjs/web'
import {App,reset,advance} from './app'
export {advance}
export function start(order:'sequential'|'together'|'natural',collapsed:boolean){reset();return renderToStream(()=> <NoHydration><Hydration id="app"><App order={order} collapsed={collapsed}/></Hydration></NoHydration>)}
export function synchronous(order:'sequential'|'natural'){reset();return renderToString(()=> <App order={order} collapsed={false}/>)}
export function prefix(order:string,collapsed:boolean){return '<!doctype html><html><head>'+generateHydrationScript()+'<script>window.revealOptions='+JSON.stringify({order,collapsed})+'</script><script type="module" src="/client.js"></script></head><body><div id="root">'}
