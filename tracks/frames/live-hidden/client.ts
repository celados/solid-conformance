import {live,GET,createServerReference,configureServerFunctionsClient,invoke} from '@solidjs/web/server-functions/client';
const requests:any[]=[],statuses:string[]=[];configureServerFunctionsClient({fetch:(address,init)=>{requests.push(address);return fetch(address,init)}});const controller=new AbortController();const source=invoke(live(GET(createServerReference('hidden'))),{signal:controller.signal});source.onstatus=(status:string)=>statuses.push(status);
const run=(async()=>{try{for await(const value of source){document.getElementById('value')!.textContent=value}}catch(error){return error}})();
(window as any).hidden={requests,statuses,stop:()=>controller.abort(),run};
