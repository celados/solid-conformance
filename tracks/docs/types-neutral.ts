import type { Element, Component, ParentComponent } from 'solid-js'
const leaf: Component = () => 'hello'
const parent: ParentComponent = props => props.children
const element: Element = [leaf({}), null, 1, false]
// RFC 09: renderer-neutral APIs do not require a DOM environment.
// @ts-expect-error No DOM library has been loaded for this compile fixture.
const forbiddenDom = document.createElement('div')
void [parent, element, forbiddenDom]
