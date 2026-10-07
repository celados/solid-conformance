import {createServerReference,registerServerReference,configureServerFunctionsServer,handleServerFunctionRequest} from "@solidjs/web/server-functions/server";
import {frameTransformResult} from "@solidjs/web/frames/server";
import {RequestContext} from "@solidjs/web";
import {AsyncLocalStorage} from "node:async_hooks";
(globalThis as any)[RequestContext]=new AsyncLocalStorage();
configureServerFunctionsServer({transformResult:frameTransformResult});
createServerReference(registerServerReference("state-reset",(id:number)=>(props:any)=><main><h1>{id}</h1><props.counter/></main>));
export const handle=handleServerFunctionRequest;
