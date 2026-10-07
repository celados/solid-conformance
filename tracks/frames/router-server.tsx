import {AsyncLocalStorage} from 'node:async_hooks'
import {RequestContext,createRequestEvent,renderToStream,NoHydration,Hydration,HydrationScript} from '@solidjs/web'
import {configureServerFunctionsServer,registerServerReference,handleServerFunctionRequest,registerFlightDataSource,GET,createServerReference} from '@solidjs/web/server-functions/server'
import {frameTransformResult,frameTransformDirectResult,frameTransformFlightResult,SERVER_COMPONENT_BOOTSTRAP,ServerComponentPlugin} from '@solidjs/web/frames/server'
import {App,controls,read} from './router-app'
const scope=new AsyncLocalStorage<any>();(globalThis as any)[RequestContext]=scope
configureServerFunctionsServer({transformResult:frameTransformResult,transformDirectResult:frameTransformDirectResult,transformFlightResult:frameTransformFlightResult,collectFlightData:()=>({[read.keyFor(1)]:frameTransformDirectResult(Story(1),{id:'wave3-router-frame',args:[1]}),[read.keyFor(2)]:frameTransformDirectResult(Story(2),{id:'wave3-router-frame',args:[2]})})})
export const calls:number[]=[];let version=0
function Story(id:number){return(props:any)=><article data-story={id}><h1>story-{id}-v{version}</h1><a data-frame-link href={'/story/'+id}>current</a><a data-frame-other href='/empty'>empty</a><props.counter $key='counter' cid={id}/><form action='/_server/wave3-router-frame-mutate' method='post'><button>save</button></form></article>}
controls.serverRead=GET(createServerReference(registerServerReference('wave3-router-frame',(id:number)=>{calls.push(id);return Story(id)})))
export let release:()=>void;registerServerReference('wave3-router-frame-mutate',async()=>{await new Promise<void>(r=>release=r);return ++version})
registerFlightDataSource('frames',()=>({one:frameTransformDirectResult(Story(1),{id:'wave3-router-frame',args:[1]}),two:frameTransformDirectResult(Story(2),{id:'wave3-router-frame',args:[2]})}))
export function handle(request:Request){return handleServerFunctionRequest(request,{onError(){}})}
export function documentStream(){return scope.run(createRequestEvent(new Request('http://localhost/story/1')),()=>renderToStream(()=><NoHydration><html><head><HydrationScript/><script innerHTML={SERVER_COMPONENT_BOOTSTRAP}/></head><body><div id='root'><Hydration id='routerframes'><App/></Hydration></div><script type='module' src='/router-client.js'/></body></html></NoHydration>,{plugins:[ServerComponentPlugin],onError(){}}))}
