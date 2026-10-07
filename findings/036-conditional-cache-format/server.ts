import {AsyncLocalStorage} from "node:async_hooks";
import {RequestContext,getRequestEvent,respond} from "@solidjs/web";
import {GET,createServerReference,registerServerReference,handleServerFunctionRequest} from "@solidjs/web/server-functions/server";
(globalThis as any)[RequestContext]=new AsyncLocalStorage();
export const calls:(string|null)[]=[];
GET(createServerReference(registerServerReference("conditional",()=>{
 const headers={etag:'"constant"',"cache-control":"private, max-age=0, must-revalidate"};
 const conditional=getRequestEvent()!.request.headers.get("if-none-match");calls.push(conditional);
 return conditional==='"constant"'?new Response(null,{status:304,headers}):respond({value:17},{headers});
})));
export const handle=handleServerFunctionRequest;
