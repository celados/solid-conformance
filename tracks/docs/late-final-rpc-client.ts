import '../records/client'
import {enablePerformanceTracks} from '@solidjs/web/performance-tracks'
const stop=enablePerformanceTracks({rich:true,minMs:0})
;(window as any).lateRPCTracks={entries:()=>performance.getEntriesByType('measure').map(e=>({name:e.name,start:e.startTime,duration:e.duration,detail:(e as PerformanceMeasure).detail})).filter(e=>e.detail?.devtools?.track==='Server'),stop}
