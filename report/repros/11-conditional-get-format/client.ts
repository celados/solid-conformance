import {GET,createServerReference,configureServerFunctionsClient} from "@solidjs/web/server-functions/client";
const statuses:number[]=[],hints:any[]=[],formats:(string|null)[]=[];
configureServerFunctionsClient({fetch:async(address,init)=>{hints.push(Object.fromEntries(new Headers(init.headers)));const response=await fetch(address,init);statuses.push(response.status);formats.push(response.headers.get("X-Server-Function-Format"));return response}});
const read=GET(createServerReference("conditional"));
(window as any).conditional=(async()=>{const first=await read();await new Promise(r=>setTimeout(r,20));const second=await read();return{first,second,statuses,hints,formats}})();
