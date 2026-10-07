import {AsyncLocalStorage} from 'node:async_hooks';
import {RequestContext,getRequestEvent} from '@solidjs/web';
import {configureServerFunctionsServer,registerServerReference,createServerReference,GET,live,handleServerFunctionRequest} from '@solidjs/web/server-functions/server';
import {Box,plugin} from '../client-codec/plugin';
(globalThis as any)[RequestContext]=new AsyncLocalStorage();export const hooks={wrap:0,transform:0,handler:0,arg:0,prepared:false,resumed:false};
configureServerFunctionsServer({codec:{plugins:[plugin]},wrapInvocation:(run,context)=>{hooks.wrap++;if(context.id!=='live-hooks'||context.direct)throw new Error('wrong HTTP invocation');hooks.prepared=getRequestEvent()!.request.headers.get('x-prepared')==='ready';hooks.resumed=getRequestEvent()!.request.headers.get('x-resume')==='given';return run()},transformResult:(_event,result)=>{hooks.transform++;return result}});
let release!:()=>void;const gate=new Promise<void>(r=>release=r);export const settle=()=>release();live(GET(createServerReference(registerServerReference('live-hooks',(arg:Box)=>{if(!(arg instanceof Box))throw new Error('rich argument codec was not applied');hooks.handler++;hooks.arg=arg.value;return {later:gate.then(()=>new Box(42))}}))));
export const handle=(request:Request)=>handleServerFunctionRequest(request);
