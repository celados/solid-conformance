import {createMemo,Loading} from 'solid-js'
import {render,reload} from '@solidjs/web'
import {createRouter,memoryHistory,query,action,useAction} from '@solidjs/router'
import {ticks} from '../../harness/timing'
async function sample(empty:boolean) {
  let generation=0,invoke!:()=>Promise<unknown>
  const calls=[0,0],target=document.createElement('div')
  const left=query(async()=>{calls[0]!++;return generation},'reload-left-'+empty)
  const right=query(async()=>{calls[1]!++;return generation},'reload-right-'+empty)
  const save=action(async()=>{generation++;return reload(empty?{revalidate:[]}:undefined)})
  function View(){invoke=useAction(save);const a=createMemo(()=>left()),b=createMemo(()=>right());return <Loading><span>{a()}:{b()}</span></Loading>}
  const Router=createRouter({history:memoryHistory('/'),routes:[{path:'/',component:View}]})
  const dispose=render(()=><Router/>,target)
  try{await ticks(20);const initial=target.textContent;await invoke();await ticks(20);return{initial,final:target.textContent,calls}}
  finally{dispose()}
}
;(window as any).result=(async()=>({all:await sample(false),none:await sample(true)}))()
