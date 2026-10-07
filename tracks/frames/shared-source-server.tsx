import {createMemo} from 'solid-js';import {renderToStream,HydrationScript} from '@solidjs/web';import {frameTransformDirectResult} from '@solidjs/web/frames/server';
export async function run(){let opened=0,closed=0;const memoSeen:number[]=[];async function* values(){opened++;try{yield 17;await new Promise(r=>setTimeout(r,15));yield 35}finally{closed++}}const iterable=values();
 const html=await renderToStream(()=>{const answer=createMemo(()=>Promise.resolve({progress:iterable}));const C=frameTransformDirectResult(()=>{const progress=createMemo(()=>answer().progress);return <b>{(()=>{const v=progress();if(memoSeen.at(-1)!==v)memoSeen.push(v);return v})()}</b>},{id:'shared-source'});return <><HydrationScript/><C/></>},{renderId:'shared'});return {html,opened,closed,memoSeen};
}
