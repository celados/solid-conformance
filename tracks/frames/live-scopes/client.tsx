import {hydrate} from '@solidjs/web';
import {configureServerFunctionsClient} from '@solidjs/web/server-functions/client';
import {App,effects} from './app';
const requests:any[]=[];configureServerFunctionsClient({fetch:(address,init)=>{requests.push({address,headers:[...new Headers(init.headers)]});return fetch(address,init)}});
const node=document.querySelector("[data-fast]");const before=node?.textContent;const unmount=hydrate(()=><App/>,document.getElementById('root')!,{renderId:'scopes'});(window as any).scopes={requests,unmount,effects,before,adoptedSameNode:node===document.querySelector("[data-fast]"),during:document.querySelector("[data-fast]")?.textContent};
