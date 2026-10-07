import type {Element} from 'solid-js'
import {For} from 'solid-js'
// 08 L700: functions are excluded from Element, so bare JSX function holes require JavaScript/a cast.
// @ts-expect-error Element deliberately excludes a function value.
const badElement:Element=()=>null
// @ts-expect-error Function children are not a general JSX insert value.
const badHole=<div>{()=> <span/>}</div>
// 08 L708: lowercase and old on: event namespaces are not declared handlers.
// @ts-expect-error Lowercase on* callback props are forbidden.
const badClick=<button onclick={()=>{}}/>
// @ts-expect-error Another lowercase on* callback prop is forbidden.
const badMouse=<button onmousedown={()=>{}}/>
// @ts-expect-error Solid1 on: namespace is forbidden.
const badOld=<button on:click={()=>{}}/>
const goodEvent=<button onClick={()=>{}}/>
const goodElement:Element=<div>{1}{null}{true}<span/></div>
const goodRenderProp=<For each={[1]}>{n=> <span>{n}</span>}</For>
void [badElement,badHole,badClick,badMouse,badOld,goodEvent,goodElement,goodRenderProp]
