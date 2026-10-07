import {AsyncLocalStorage} from 'node:async_hooks'
import {createRequestEvent,RequestContext,renderToStream,createSSRResponse,clearFlashCookie} from '@solidjs/web'
import {createServerReference,registerServerReference,handleServerFunctionRequest,configureServerFunctionsServer,createNoJSHandler,decodeFlashCookie} from '@solidjs/web/server-functions/server'
import {query} from '@solidjs/router'
import {contractApp} from './contract-app'
;(globalThis as any)[RequestContext]??=new AsyncLocalStorage()
let generation=0,reads=0;const data=query(createServerReference(registerServerReference('router-meta-read',async(n:number)=>{reads++;return n+2+generation})),'router-meta');export function dataCounts(){return{reads,generation,key:data.keyFor(3)}}
const reference=createServerReference(registerServerReference('router-contract-save',async(data:FormData)=>{const value=String(data.get('label'));if(value==='fail')throw new Error('router-contract-error');generation++;return 'saved:'+value})) as (data:FormData)=>Promise<unknown>
let hooks=0;const noJS=createNoJSHandler();configureServerFunctionsServer({secret:'wave3-local-test-only-flash-secret-not-a-production-credential',collectFlightData:()=>({[data.keyFor(3)]:5+generation}),handleNoJS:(...args)=>{hooks++;return noJS(...args)}})
export function count(){return hooks}
export async function handle(request:Request){return handleServerFunctionRequest(request)}
export async function document(request:Request){const event=createRequestEvent(request);const seed=await decodeFlashCookie(request.headers.get('cookie'));if(seed){(event as any).router={submission:seed};event.response.headers.append('Set-Cookie',clearFlashCookie())};const{App}=contractApp(reference);return(globalThis as any)[RequestContext].run(event,()=>createSSRResponse(renderToStream(()=><html><head/><body><div id="root"><App/></div></body></html>),event))}
