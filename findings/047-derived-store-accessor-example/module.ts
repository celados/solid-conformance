import {createRoot,createStore} from 'solid-js'
export function run(literal=false){return createRoot(dispose=>{try{const [items]=createStore(()=>[1,2],[]);const [cache]=createStore(draft=>{draft.total=literal?(items as unknown as ()=>number[])().length:items.length},{total:0});return cache.total}finally{dispose()}})}
