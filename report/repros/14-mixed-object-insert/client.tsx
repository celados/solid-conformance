import {render} from '@solidjs/web'
function sample(mixed:boolean){const target=document.createElement('div');let dispose:(()=>void)|undefined;try{const value={bad:true};dispose=render(()=>mixed?<div>valid{value as any}</div>:<div>{value as any}</div>,target);return{error:null,text:target.textContent}}catch(error){return{error:String(error),text:target.textContent}}finally{dispose?.()}}
;(window as any).result={sole:sample(false),mixed:sample(true)}
