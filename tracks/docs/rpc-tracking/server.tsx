import {createMemo,Loading} from 'solid-js'
import {createRequestEvent,renderToStream,NoHydration,Hydration,generateHydrationScript} from '@solidjs/web'
import {registerServerReference,createServerReference,handleServerFunctionRequest} from '@solidjs/web/server-functions/server'
import {provideRequestEvent} from '@solidjs/web/storage'
import {enableRichArguments} from '@solidjs/web/server-functions/rich-args'
enableRichArguments()
let network=false,count=0
const fn=createServerReference(registerServerReference('tracking-read',async(_arg:unknown)=>{if(network){count++;return 99}return 7}))
function App(){const read=createMemo(()=>fn('arg'));return<Loading fallback={<b>waiting</b>}><span>{read()}</span></Loading>}
export async function document(mode:string){count=0;const html=await provideRequestEvent(createRequestEvent(new Request('http://tracking.test/')),()=>renderToStream(()=> <NoHydration><Hydration id="app"><App/></Hydration></NoHydration>));return '<!doctype html><html><head>'+generateHydrationScript()+'<script>window.rpcMode='+JSON.stringify(mode)+'</script><script type="module" src="/client.js"></script></head><body><div id="root">'+html+'</div></body></html>'}
export async function handle(request:Request){network=true;try{return await handleServerFunctionRequest(request)}finally{network=false}}
export function requests(){return count}
