import {hydrate} from '@solidjs/web'
import {App,refs} from './app'
const original=[...document.querySelectorAll('#root span')]
hydrate(()=> App((window as unknown as {revealOptions:{order:'sequential'|'together'|'natural',collapsed:boolean}}).revealOptions),document.getElementById('root')!,{renderId:'app'})
Object.assign(window,{revealHydrated:true,revealClaims:refs.map((node,i)=>node===original[i])})
