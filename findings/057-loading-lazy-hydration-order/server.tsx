import {renderToStream,HydrationScript,NoHydration,Hydration} from '@solidjs/web'
import {App} from './app'
export function stream(){
 return renderToStream(() => <NoHydration><html><head><HydrationScript/></head><body><div id="root"><Hydration id="app"><App/></Hydration></div><script type="module" async src="/client.js"/></body></html></NoHydration>, {manifest:{'findings/057-loading-lazy-hydration-order/part.tsx':{file:'part.js'}}})
}
