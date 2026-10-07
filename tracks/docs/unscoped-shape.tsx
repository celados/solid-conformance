import {For,Errored,createMemo,children} from 'solid-js'
function Bad(props:any){const head=()=>props.header;return <div><header>{head as any}</header><main>{props.children}</main></div>}
function Good(props:any){const head=()=>props.header;return <div><header>{head()}</header><main>{props.children}</main></div>}
export function Shape(props:{bad:boolean,clicked:()=>void}){return props.bad?<Bad header={<button onClick={props.clicked}>header</button>}><button onClick={props.clicked}>child</button></Bad>:<Good header={<button onClick={props.clicked}>header</button>}><button onClick={props.clicked}>child</button></Good>}
export function NegativeShapes(){const memo=createMemo(()=> <b>memo</b>);const read=children(()=> <b>children</b>);return <><div>{memo()}</div><div>{read()}</div><For each={[1]}>{v=><p>{v}</p>}</For><Errored fallback={()=><b>fallback</b>}><span>valid</span></Errored></>}
