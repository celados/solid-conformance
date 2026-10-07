import {createSignal,flush,OBSERVE} from 'solid-js'
import {attribution} from 'solid-js/attribution'
import {render} from '@solidjs/web'
const records:any[]=[],entries:any[]=[],stamps:number[]=[]
const release=attribution.enable({log:false,checks:false,holds:false})
const off=OBSERVE?.records.subscribe('interaction',event=>records.push(event))
const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())entries.push(entry.toJSON())})
observer.observe({type:'event',buffered:true,durationThreshold:16} as PerformanceObserverInit)
function App(){const[count,set]=createSignal(0);const handler=(event:MouseEvent)=>{stamps.push(event.timeStamp);const until=performance.now()+30;while(performance.now()<until){};set(n=>n+1);flush()};return <button id="input-test" onClick={handler}>{count()}</button>}
const close=render(()=><App/>,document.querySelector('#root')!)
;(window as any).inputHarness={snapshot:()=>({records,entries,stamps,count:document.querySelector('button')?.textContent}),close(){observer.disconnect();off?.();release();close()}}
