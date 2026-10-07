import {Loading,Reveal,createMemo} from 'solid-js'
import {isServer} from '@solidjs/web'
export const refs:Element[]=[]
let gates:{promise:Promise<number>,resolve:(n:number)=>void}[]=[]
export function reset(){gates=Array.from({length:2},()=>{let resolve!:(n:number)=>void;const promise=new Promise<number>(done=>{resolve=done});return{promise,resolve}})}
export function advance(i:number){gates[i]!.resolve(i)}
export function App(props:{order:'sequential'|'together'|'natural',collapsed:boolean}){const a=createMemo(()=>isServer?gates[0]!.promise:Promise.resolve(-1)),b=createMemo(()=>isServer?gates[1]!.promise:Promise.resolve(-1));return<Reveal order={props.order} collapsed={props.collapsed}><Loading fallback={<b>A</b>}><span ref={(node:Element)=>{refs[0]=node}}>{a()}</span></Loading><Loading fallback={<b>B</b>}><span ref={(node:Element)=>{refs[1]=node}}>{b()}</span></Loading></Reveal>}
