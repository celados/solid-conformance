export function Shape(props:{clicked:()=>void}){return <div {...{children:<button onClick={props.clicked}>click</button>}}/>}
