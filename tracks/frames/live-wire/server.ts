import {GET,registerServerReference,createServerReference,handleServerFunctionRequest,configureServerFunctionsServer} from '@solidjs/web/server-functions/server';
import {AsyncLocalStorage} from 'node:async_hooks';
import {RequestContext,createRequestEvent} from '@solidjs/web';
const scope=new AsyncLocalStorage();(globalThis as any)[RequestContext]=scope;
export async function heartbeat(){
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);let closed=0;
 configureServerFunctionsServer({chaosReconnectEvery:0});
 GET(createServerReference(registerServerReference('heartbeat-fixture',async function*(){try{yield 17;await gate}finally{closed++}})));
 const request=new Request('http://127.0.0.1/_server/live/heartbeat-fixture?args=[]');
 const response=await scope.run(createRequestEvent(request),()=>handleServerFunctionRequest(request));
 const reader=response.body!.getReader();const decoder=new TextDecoder();let initial='';
 while(!initial.includes('"s":17')){const chunk=await reader.read();if(chunk.done)throw new Error('fixture closed before initial value');initial+=decoder.decode(chunk.value)}
 const started=performance.now();let text='';while(!text.includes(':\n\n')){const chunk=await reader.read();if(chunk.done)throw new Error('fixture closed without heartbeat');text+=decoder.decode(chunk.value)}
 const elapsed=performance.now()-started;await reader.cancel();release();await new Promise(r=>setTimeout(r,10));
 return {initial,text,elapsed,closed,headers:Object.fromEntries(response.headers)};
}
export async function chaos(){
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);let closed=0;
 configureServerFunctionsServer({chaosReconnectEvery:30});
 GET(createServerReference(registerServerReference('chaos-fixture',async function*(){try{yield 42;await gate}finally{closed++}})));
 const request=new Request('http://127.0.0.1/_server/live/chaos-fixture?args=[]');const response=await scope.run(createRequestEvent(request),()=>handleServerFunctionRequest(request));const reader=response.body!.getReader();const decoder=new TextDecoder();let initial='';
 while(!initial.includes('"s":42')){const chunk=await reader.read();if(chunk.done)throw new Error('fixture closed before initial value');initial+=decoder.decode(chunk.value)}
 const outcome=await Promise.race([reader.read().then(()=>({kind:'resolved'}),error=>({kind:'error',message:error.message})),new Promise(r=>setTimeout(()=>r({kind:'pending'}),70))]);
 await reader.cancel().catch(()=>{});release();await new Promise(r=>setTimeout(r,10));configureServerFunctionsServer({chaosReconnectEvery:0});return {initial,outcome,closed};
}
