import * as frames from '../frames/server'
import { OBSERVE, createMemo, Loading } from 'solid-js'
import { renderToStream, renderToString, getRequestEvent, createRequestEvent, RequestContext } from '@solidjs/web'
import { registerServerReference, createServerReference, configureServerFunctionsServer, handleServerFunctionRequest } from '@solidjs/web/server-functions/server'
const records:{type:string;event:any;live:any}[]=[]
const offs=['invocation','render','boundary','request','frame','recovery'].map(type=>OBSERVE?.records.subscribe(type as any,(event,live:any)=>records.push({type,event,live:{request:!!live?.request,response:!!live?.response,args:live?.args,result:live?.result,error:live?.error?String(live.error):undefined}}),{bodies:true}))
export const echo=createServerReference(registerServerReference('records-echo',async(value:unknown)=>{await new Promise(r=>setTimeout(r,5));return{value}}))
export const failing=createServerReference(registerServerReference('records-fail',()=>{throw new Error('private-record-error')}))
const streamReference=createServerReference(registerServerReference('records-stream',async function*(){yield 1}))
export function reset(){records.length=0}
export function snapshot(){return records}
export function stop(){offs.forEach(off=>off?.())}
export async function serverCases(){
 const event=createRequestEvent(new Request('http://records.local/'))
 return (globalThis as any)[RequestContext].run(event,async()=>{
  reset();const sync=createServerReference(registerServerReference('records-sync',(n:number)=>n+1));const result=sync(2)
  await echo('private-argument');try{await failing()}catch{}
  const stream=streamReference() as AsyncIterable<number>;for await(const _ of stream)break
  renderToString(()=> <span>sync</span>)
  function Data(){const value=createMemo(()=>echo('boundary-secret'));return <b>{String(value().value)}</b>}
  await renderToStream(()=> <Loading fallback={<i>pending</i>}><Data/></Loading>,{renderId:'recorded'})
  return{result,records:[...records]}
 })
}
export async function handle(request:Request){if(new URL(request.url).pathname==='/records/server')return Response.json(snapshot());return handleServerFunctionRequest(request)}
// Keep frame transforms installed for the HTTP server's component response.
export {frames}
export {traceCases} from './trace-cases'
