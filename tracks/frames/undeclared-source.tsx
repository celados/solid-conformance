import {OBSERVE,Loading,createMemo,createComponent} from 'solid-js';
import {renderToStream,RequestContext,createRequestEvent,isDev,dynamic} from '@solidjs/web';
import {configureServerFunctionsServer,registerServerReference,createServerReference,GET,live} from '@solidjs/web/server-functions/server';
import {renderServerComponent,frameTransformDirectResult,frameTransformResult,ServerComponentPlugin} from '@solidjs/web/frames/server';
import {AsyncLocalStorage} from 'node:async_hooks';
const scope=new AsyncLocalStorage();(globalThis as any)[RequestContext]=scope;
configureServerFunctionsServer({transformResult:frameTransformResult,transformDirectResult:frameTransformDirectResult});
export async function run(abort=false,delay=5300){return scope.run(createRequestEvent(new Request('http://localhost/')),async()=>{
 const session=OBSERVE?.diagnostics.capture(), old=console.warn;console.warn=()=>{};
 const stats:Record<string,{opened:number,closed:number}>={},release:Array<()=>void>=[],controllers:AbortController[]=[];
 const make=(id:string)=>{stats[id]={opened:0,closed:0};let done!:()=>void;const gate=new Promise<void>(r=>done=r);release.push(done);return async function*(){stats[id]!.opened++;try{yield 17;await gate;yield 18}finally{stats[id]!.closed++}}};
 const part=(source:()=>AsyncIterable<number>)=>()=>{const v=createMemo(source);return <b>{v()}</b>};
 try{
 const Source=part(make('document'));const ref=GET(createServerReference(registerServerReference('undeclared-document',()=>Source)));const C=dynamic(()=>ref());
 const ctrl=new AbortController();controllers.push(ctrl);const doc=renderToStream(()=>createComponent(C,{},'DocumentSource'),{signal:ctrl.signal,onError(){},plugins:[ServerComponentPlugin]});let html='';let ended=false;doc.pipe({write:c=>{html+=String(c)},end:()=>{ended=true}});
 const LivePart=part(make('live-document'));const liveRef=live(GET(createServerReference(registerServerReference('declared-document',()=>LivePart))));const L=dynamic(()=>liveRef());const liveDoc=renderToStream(()=>createComponent(L,{},'DeclaredSource'),{plugins:[ServerComponentPlugin]});let liveEnded=false;liveDoc.pipe({write(){},end(){liveEnded=true}});
 const frameCtrl=new AbortController();controllers.push(frameCtrl);const F=part(make('frame'));const frame=renderServerComponent(F,{signal:frameCtrl.signal,live:true,frame:{id:'standing-frame'}});frame.pipe({write(){}});
 await new Promise(r=>setTimeout(r,delay));const events=session?.events.filter(e=>e.code==='SSR_UNDECLARED_LIVE_SOURCE')??[];const before=structuredClone(stats);const state={isDev,events,html,ended,liveEnded,before};if(abort)controllers.forEach(c=>c.abort());release.forEach(r=>r());await new Promise(r=>setTimeout(r,30));return {...state,after:stats};
 }finally{controllers.forEach(c=>c.abort());release.forEach(r=>r());session?.stop();console.warn=old}
})}
