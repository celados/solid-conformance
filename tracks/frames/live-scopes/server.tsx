import {AsyncLocalStorage} from 'node:async_hooks';
import {RequestContext,createRequestEvent,renderToStream,NoHydration,Hydration,HydrationScript} from '@solidjs/web';
import {registerServerReference,createServerReference,GET,live,handleServerFunctionRequest} from '@solidjs/web/server-functions/server';
import {App,fast,slow,releaseSlow,stats} from './app';
const scope=new AsyncLocalStorage();(globalThis as any)[RequestContext]=scope;
live(GET(createServerReference(registerServerReference('scopes-fast',fast))));live(GET(createServerReference(registerServerReference('scopes-slow',slow))));
export {releaseSlow,stats};export const handle=(request:Request)=>handleServerFunctionRequest(request);
export const document=(request:Request)=>scope.run(createRequestEvent(request),()=>renderToStream(()=><NoHydration><html><head><HydrationScript/></head><body><div id="root"><Hydration id="scopes"><App/></Hydration></div><script type="module" async src="/client.js"/></body></html></NoHydration>));
