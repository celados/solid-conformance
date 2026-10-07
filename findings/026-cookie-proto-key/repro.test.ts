import { test, expect } from 'bun:test'
import { parseCookieHeader } from '@solidjs/web'

test('12-ssr-http.md: valid cookie names including __proto__ decode to their string value',()=>{
 const cookies=parseCookieHeader('__proto__=x')
 expect(Object.hasOwn(cookies,'__proto__')).toBe(true)
 expect(cookies['__proto__']).toBe('x')
})
