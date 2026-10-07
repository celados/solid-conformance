import { Errored } from "solid-js";
import { configureServerErrors, renderToString, RequestContext, createRequestEvent } from "@solidjs/web";
import { createServerReference } from "@solidjs/web/server-functions/server";
import { AsyncLocalStorage } from "node:async_hooks";
const scope=new AsyncLocalStorage();
(globalThis as any)[RequestContext]=scope;
export function run() {return scope.run(createRequestEvent(new Request("http://localhost/")),()=>{
 let ambient=0,local=0,site:any,seen:unknown;
 const original=new Error("failure");
 const fn=createServerReference({id:"direct-hook",fn:()=>{throw original}});
 configureServerErrors({onError:()=>{ambient++;return new Error("ambient")}});
 try {
  const html=renderToString(()=><Errored fallback={e=><b>{(e() as Error).message}</b>}><span>{fn()}</span></Errored>,{onError:(error,context)=>{local++;site=context;seen=error;return new Error("local")}});
  return {html,ambient,local,direct:site.direct,kind:site.kind,id:site.functionId,original:seen===original};
 }finally{configureServerErrors({onError:undefined})}
})}

