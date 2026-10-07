import {OpaqueReference} from "@solidjs/web/serialization";
import {RequestContext} from "@solidjs/web";
import {AsyncLocalStorage} from "node:async_hooks";
import {registerServerReference,handleServerFunctionRequest,decodeResponse} from "@solidjs/web/server-functions/server";
(globalThis as any)[RequestContext]=new AsyncLocalStorage();
let serial=0;
export async function run(Foreign:typeof OpaqueReference){
 const values:any[]=[];
 for(const Constructor of [OpaqueReference,Foreign]){
  const id="codec-edge-"+serial++;
  registerServerReference(id,()=>new Constructor(()=>"private hidden value",17));
  const response=await handleServerFunctionRequest(new Request("http://localhost/_server/data/"+id,{method:"POST",body:"[]",headers:{origin:"http://localhost","content-type":"application/json","X-Server-Function-Format":"8"}}),{onError:()=>{}});
  values.push(await decodeResponse(response).then(value=>({value}),error=>({error:String(error)})));
 }
 return {sameConstructor:Foreign===OpaqueReference,values};
}
