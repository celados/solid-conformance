import {renderToString,NoHydration,Hydration,getHydrationWriter,generateHydrationScript} from '@solidjs/web'
function App(){getHydrationWriter()!.write('boot:value',7);return<span>{7}</span>}
export function body(){return '<body><div id="root">'+renderToString(()=> <NoHydration><Hydration id="app"><App/></Hydration></NoHydration>)+'</div></body></html>'}
export function bootstrap(){return generateHydrationScript()}
