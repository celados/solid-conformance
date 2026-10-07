import {AsyncLocalStorage} from 'node:async_hooks';
import {RequestContext,createRequestEvent,getRequestEvent} from '@solidjs/web';
import {GET,live,createServerReference,registerServerReference,handleServerFunctionRequest} from '@solidjs/web/server-functions/server';
const scope=new AsyncLocalStorage();(globalThis as any)[RequestContext]=scope;let release!:()=>void;const gate=new Promise<void>(r=>release=r);export const sendSecond=()=>release();export const stats={opened:0,closed:0};
async function* source(){stats.opened++;const signal=getRequestEvent()!.request.signal;const aborted=new Promise<void>(r=>{if(signal.aborted)r();else signal.addEventListener('abort',()=>r(),{once:true})});try{yield 'first';await gate;yield 'second';await aborted}finally{stats.closed++}}
live(GET(createServerReference(registerServerReference('hidden',source))));export const handle=(request:Request)=>scope.run(createRequestEvent(request),()=>handleServerFunctionRequest(request));
