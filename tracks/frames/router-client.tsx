import {render,hydrate} from '@solidjs/web'
import {flush} from 'solid-js'
import {installServerComponents} from '@solidjs/web/frames'
import {configureServerFunctionsClient} from '@solidjs/web/server-functions/client'
import {App,controls} from './router-app'
installServerComponents()
const requests:any[]=[]
configureServerFunctionsClient({fetch:(url,init)=>{requests.push({url,method:init.method,singleFlight:new Headers(init.headers).get('X-Single-Flight')});return fetch(url,init)}})
const root=document.querySelector('#root')!
const close=location.search.includes('hydrate')?hydrate(App,root,{renderId:'routerframes'}):render(App,root)
Object.assign(controls,{requests,close,pause:async()=>{for(let i=0;i<25;i++){await new Promise(r=>setTimeout(r,10));flush()}}})
;(window as any).routerFrames=controls
