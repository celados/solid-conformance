import {OBSERVE} from 'solid-js'
export function channel(){return OBSERVE?.records}
export function serverSlot(){return OBSERVE?.server}
