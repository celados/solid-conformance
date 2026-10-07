import {configureServerFunctionsClient,createServerReference,GET,live} from '@solidjs/web/server-functions/client';
import {enableRichArguments} from '@solidjs/web/server-functions/rich-args';
enableRichArguments();
import {Box,plugin} from '../client-codec/plugin';
const hooks={prepare:0,fetch:0,capture:0,response:0,resume:0};let value:number|undefined,boxed=false,done=false,error:string|undefined;
configureServerFunctionsClient({codec:{plugins:[plugin]},prepareRequest:async(init,context)=>{if(context.id!=='live-hooks')throw new Error('wrong context');hooks.prepare++;await Promise.resolve();const headers=new Headers(init.headers);headers.set('x-prepared','ready');return{...init,headers}},fetch:(address,init)=>{hooks.fetch++;return fetch(address,init)},responseHandler:{resume:()=>{hooks.resume++;return {headers:{"x-resume":"given"}}},capture:()=>{hooks.capture++;return "captured"},handle:(_response,context)=>{if(context.context!=="captured")throw new Error("capture context lost");hooks.response++;return undefined}}});
const source=live(GET(createServerReference('live-hooks')))(new Box(7));const iterator=source[Symbol.asyncIterator]();
(window as any).liveHooks={snapshot:()=>({hooks,value,boxed,done,error})};
(async()=>{try{const first=await iterator.next();const result=await first.value.later;value=result.value;boxed=result instanceof Box;done=(await iterator.next()).done===true} catch(e){error=String(e)}})();
