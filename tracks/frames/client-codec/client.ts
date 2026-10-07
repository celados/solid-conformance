import {configureServerFunctionsClient,createServerReference} from '@solidjs/web/server-functions/client';
import {Box,plugin} from './plugin';
const requests:any[]=[];configureServerFunctionsClient({endpoint:'/custom',codec:{plugins:[plugin]},fetch:(...args:[string,RequestInit])=>{requests.push({address:args[0],argc:args.length});return fetch(...args)}});
const fn=createServerReference('box');const value=await fn();configureServerFunctionsClient({codec:{plugins:[]}});const failure=await fn().then(()=>null,error=>error.message);
(window as any).result={instance:value instanceof Box,value:value.value,keys:Object.keys(value),failure,requests};
