import { OBSERVE } from 'solid-js';
import { renderToStream } from '@solidjs/web';
export async function run(){
 const records:any[]=[];const off=OBSERVE?.records.subscribe('render',event=>records.push(event));
 const original=new Error('first pass');let caught:unknown;
 try{
  await renderToStream(()=> 'normal');const positive=records.splice(0);
  try{renderToStream(()=>{throw original},{onError(){}})}catch(error){caught=error}
  return {positive,records,sameError:caught===original};
 }finally{off?.()}
}
