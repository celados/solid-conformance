import {Loading} from 'solid-js'
import {dynamic} from '@solidjs/web'
import {ticks} from '../../harness/timing'
export function dynamicTrackingCase(){
 let calls=0
 const docs:{id:string,file:string,statement:string,observations:{calls:number}}[]=[]
 function App(){const Tag=dynamic(()=>{calls++;return Promise.resolve('article' as const)});return<Loading fallback={<b>pending</b>}><Tag/></Loading>}
 return{App,streams:[],docs,async settle(){await ticks(4);docs.push({id:'041',file:'03-control-flow.md',statement:'An adopted async dynamic source is not re-run on hydration.',observations:{calls}})}}
}
