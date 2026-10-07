import { isServer, isDev, getRequestEvent, redirect, respond } from '@solidjs/web'
import * as sf from '@solidjs/web/server-functions'
import { equal, ok, throws, type DocCase } from './registry'
const cases:DocCase[]=[]
function doc(name:string,statement:string,run:DocCase['run']){cases.push({id:`10/${name}`,file:'10-server-functions.md',statement,run})}
let serial=0
function reference(fn:(...args:any[])=>any){return server.createServerReference(server.registerServerReference('docs-'+serial++,fn)) as sf.ServerFunction<any[],any>}
const server=sf as unknown as typeof import('@solidjs/web/server-functions/server')
function request(id:string,method='POST',body?:unknown){return new Request('http://conformance.test/_server/data/'+id,{method,headers:{origin:'http://conformance.test','content-type':'application/json','X-Server-Function-Format':'8'},...(method==='POST'?{body:JSON.stringify(body??[])}:{})})}

if(isServer){
	doc('direct-call','In-process SSR calls execute the original function directly with no HTTP loopback.',async()=>{const fn=reference((n:number)=>n+1);equal(await fn(2),3)})
	doc('reference-id','Both proxies carry id and url.',()=>{const fn=reference(()=>7);ok(fn.id.startsWith('docs-'));ok(fn.url.includes(fn.id))})
	doc('reference-brand','isServerFunction reads the symbol-branded reference contract.',()=>{const fn=reference(()=>7);equal(sf.isServerFunction(fn),true);equal(sf.isServerFunction(()=>7),false)})
	doc('reference-nonfunction','registerServerReference throws when handed a non-function.',()=>{throws(()=>reference(7 as any))})
	doc('metadata-merge','withMeta returns the reference and shallow-merges later writes over earlier ones.',()=>{const fn=reference(()=>7);const a=sf.withMeta(fn,{a:1,nested:{old:true}});const b=sf.withMeta(a,{a:2,nested:{new:true}});equal(sf.getServerFunctionMetadata(b)?.a,2);equal(sf.getServerFunctionMetadata(b)?.nested,{new:true})})
	doc('get-metadata','GET composes with withMeta in either order.',()=>{const fn=reference(()=>7);const decorated=sf.GET(sf.withMeta(fn,{custom:1}));equal(sf.getServerFunctionMetadata(decorated)?.method,'GET');equal(sf.getServerFunctionMetadata(decorated)?.custom,1)})
	doc('http-dispatch','The handler resolves id, decodes positional arguments and encodes the result.',async()=>{const fn=reference((a:number,b:number)=>a+b);const response=await server.handleServerFunctionRequest(request(fn.id,'POST',[2,3]));equal(response.status,200);equal(await sf.decodeResponse(response),5)})
	doc('default-post','Undeclared references call over POST; GET requires declaration.',async()=>{const fn=reference(()=>7);const response=await server.handleServerFunctionRequest(request(fn.id,'GET'));equal(response.status,405)})
	doc('get-read','GET declared references permit GET and HEAD without a body on HEAD.',async()=>{const fn=sf.GET(reference(()=>7));const read=await server.handleServerFunctionRequest(request(fn.id,'GET'));equal(read.status,200);equal(await sf.decodeResponse(read),7);const head=await server.handleServerFunctionRequest(request(fn.id,'HEAD'));equal(head.status,200);equal(head.body,null)})
	doc('method-405','Other methods receive 405.',async()=>{const fn=reference(()=>7);equal((await server.handleServerFunctionRequest(request(fn.id,'DELETE'))).status,405)})
	doc('unknown-reference','An unregistered well-formed address receives a labelled 404.',async()=>{const response=await server.handleServerFunctionRequest(request('missing-function-id'));equal(response.status,404);ok(response.headers.has('X-Server-Function-Unknown'))})
	doc('no-store-default','Every response has Cache-Control no-store unless the function declares a policy.',async()=>{const fn=reference(()=>7);const response=await server.handleServerFunctionRequest(request(fn.id));equal(response.headers.get('cache-control'),'no-store')})
	doc('cache-opt-in','Cache headers flow through the handler response metadata.',async()=>{const fn=sf.GET(reference(()=>respond(7,{headers:{'cache-control':'max-age=60'}})));const response=await server.handleServerFunctionRequest(request(fn.id,'GET'));equal(response.headers.get('cache-control'),'max-age=60');equal(await sf.decodeResponse(response),7)})
	doc('redirect-control','Thrown Response/envelope control flow is forwarded untouched.',async()=>{const fn=reference(()=>{throw redirect('/login')});const response=await server.handleServerFunctionRequest(request(fn.id));ok(response.headers.get(sf.REDIRECT_HEADER)||response.headers.get('Location'))})
	doc('thrown-sanitization','Outside development plain thrown errors are replaced with a generic Error.',async()=>{const fn=reference(()=>{throw new Error('private-detail')});const response=await server.handleServerFunctionRequest(request(fn.id),{onError:()=>{}});const error=await sf.decodeResponse(response).catch(e=>e);ok(error instanceof Error);equal((error as Error).message,isDev?'private-detail':'Internal Server Error')})
	doc('per-call-event','Direct calls get a shallow copy of locals while nested values remain shared.',async()=>{const event=getRequestEvent()!;event.locals.token='outer';event.locals.shared={n:1};const fn=reference(()=>{const e=getRequestEvent()!;equal(e.locals.token,'outer');e.locals.token='inner';return e.locals.shared});equal(await fn()===event.locals.shared,true);equal(event.locals.token,'outer')})
	doc('invocation-context','getServerFunctionInvocation answers the current in-flight id.',async()=>{let fn:ReturnType<typeof reference>;fn=reference(()=>server.getServerFunctionInvocation()?.id);equal(await fn(),fn.id)})
	doc('invoke-direct','Server invoke runs in-process; transport hints are no-ops.',async()=>{const fn=reference((n:number)=>n+1);equal(await sf.invoke(fn,{priority:'low',keepalive:true},3),4)})
	doc('invoke-contract','Non-invocable wrappers produce a directed error.',()=>{throws(()=>sf.invoke((()=>7) as any,{}))})
}
export const rpcCases=cases
