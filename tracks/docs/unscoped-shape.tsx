import {Portal} from '@solidjs/web'
import {For,Errored,createMemo,children} from 'solid-js'
function Bad(props:any){const head=()=>props.header;return <div><header>{head as any}</header><main>{props.children}</main></div>}
function Good(props:any){const head=()=>props.header;return <div><header>{head()}</header><main>{props.children}</main></div>}
export function Shape(props:{bad:boolean,clicked:()=>void}){return props.bad?<Bad header={<button onClick={props.clicked}>header</button>}><button onClick={props.clicked}>child</button></Bad>:<Good header={<button onClick={props.clicked}>header</button>}><button onClick={props.clicked}>child</button></Good>}
export function NegativeShapes(){const memo=createMemo(()=> <b>memo</b>);const read=children(()=> <b>children</b>);return <><div>{memo()}</div><div>{read()}</div><For each={[1]}>{v=><p>{v}</p>}</For><Errored fallback={()=><b>fallback</b>}><span>valid</span></Errored></>}

export function Solo(props:{clicked:()=>void}){const head=()=> <button onClick={props.clicked}>header</button>;return <header>{head as any}</header>}

function Spread(props:any){return <div {...props}/>}
function Failure():never{throw new Error('contained')}
export function HydratedNegatives(props:{clicked:()=>void}){const memo=createMemo(()=> <button onClick={props.clicked}>memo</button>);const read=children(()=> <button onClick={props.clicked}>children</button>);return <><div>{memo as any}</div><div>{read as any}</div><For each={[1]}>{v=><button onClick={props.clicked}>row{v}</button>}</For><Errored fallback={()=><button onClick={props.clicked}>fallback</button>}><Failure/></Errored><Spread><button onClick={props.clicked}>spread</button></Spread><Portal><button onClick={props.clicked}>portal</button></Portal></>}
