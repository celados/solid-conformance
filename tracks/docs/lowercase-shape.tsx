import {assign} from '@solidjs/web'
export function Shape(props:{mode:string,handler:()=>void}){
 // @ts-expect-error Intentional documented JavaScript-only lowercase callback misuse.
 if(props.mode==='compiled')return <button onclick={props.handler}>click</button>
 if(props.mode==='spread')return <button {...{onclick:props.handler} as any}>click</button>
 return <button ref={el=>{assign(el,{onclick:props.handler})}}>click</button>
}
