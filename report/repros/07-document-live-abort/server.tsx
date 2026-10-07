import {createMemo} from 'solid-js';
import {renderToStream} from '@solidjs/web';
import {frameTransformDirectResult} from '@solidjs/web/frames/server';
export async function run(abort=true){
 let release!:()=>void,closed=0;const pending=new Promise<void>(r=>release=r);
 async function* values(){try{yield 1;await pending}finally{closed++}}
 const C=frameTransformDirectResult(()=>{const value=createMemo(values);return <b>{value()}</b>},{id:'minimal'});
 const ctrl=new AbortController();let html='';const stream=renderToStream(()=>C(),{signal:ctrl.signal,onError(){}});stream.pipe({write:c=>{html+=String(c)},end(){}});
 await new Promise(r=>setTimeout(r,10));if(abort)ctrl.abort();release();await new Promise(r=>setTimeout(r,30));return {html,closed};
}
