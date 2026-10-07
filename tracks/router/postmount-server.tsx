import {AsyncLocalStorage} from 'node:async_hooks'
import {RequestContext,createRequestEvent,renderToString,generateHydrationScript} from '@solidjs/web'
import {App} from './postmount-shape'
const context=new AsyncLocalStorage<any>();(globalThis as any)[RequestContext]=context
export function html(){return context.run(createRequestEvent(new Request('http://router.test/')),()=>generateHydrationScript()+'<div id="root">'+renderToString(App)+'</div>')}
