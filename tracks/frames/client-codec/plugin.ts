import {createPlugin,OpaqueReference} from '@solidjs/web/serialization';
export class Box{constructor(public value:number){}}
export const plugin=createPlugin<Box,{value:any}>({tag:'conformance/client-codec/Box',test:value=>value instanceof Box,parse:{sync:(value,ctx)=>({value:ctx.parse(new OpaqueReference(()=>"private",value.value))}),stream:(value,ctx)=>({value:ctx.parse(new OpaqueReference(()=>"private",value.value))})},serialize:(node,ctx)=>'({value:'+ctx.serialize(node.value)+'})',deserialize:(node,ctx)=>new Box(ctx.deserialize<number>(node.value))});
