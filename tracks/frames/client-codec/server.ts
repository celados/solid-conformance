import {AsyncLocalStorage} from 'node:async_hooks';
import {RequestContext} from '@solidjs/web';
import {configureServerFunctionsServer,registerServerReference,handleServerFunctionRequest} from '@solidjs/web/server-functions/server';
import {Box,plugin} from './plugin';
(globalThis as any)[RequestContext]=new AsyncLocalStorage();configureServerFunctionsServer({endpoint:'/custom',codec:{plugins:[plugin]}});registerServerReference('box',()=>new Box(17));
export const handle=(request:Request)=>handleServerFunctionRequest(request);
