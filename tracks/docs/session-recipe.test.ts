import { test, expect } from 'bun:test'
import { createCookie } from '@remix-run/cookie'

// 12-ssr-http.md L255–297: execute the documented signed-session recipe with
// a controlled clock and test-only secrets. The MAC protects integrity, not secrecy.
function recipe(secrets:string[],now:()=>number){
 const maxAge=60*60*24*7
 const cookie=createCookie('session',{secrets,httpOnly:true,secure:true,sameSite:'Lax',maxAge})
 return{cookie,async read(header:string|null){const raw=await cookie.parse(header);if(!raw)return null;try{const {data,exp}=JSON.parse(raw);return typeof exp==='number'&&now()<exp*1000?data:null}catch{return null}},async write(data:unknown){const exp=Math.floor(now()/1000)+maxAge;return cookie.serialize(JSON.stringify({data,exp}))},async clear(){return cookie.serialize('',{maxAge:0})}}
}
const asRequest=(setCookie:string)=>setCookie.split(';')[0]!
test('12-ssr-http.md: session recipe validates integrity, secret rotation, server expiry, malformed input and clearing',async()=>{
 let now=1_700_000_000_000
 const current=recipe(['test-current-secret'],()=>now)
 const header=await current.write({userId:'u1'})
 const request=asRequest(header)
 expect(await current.read(request)).toEqual({userId:'u1'})
 const readablePayload=Buffer.from(decodeURIComponent(request.slice('session='.length)).split('.')[0]!, 'base64').toString()
 expect(readablePayload).toContain('u1')
 for(const attribute of ['HttpOnly','Secure','SameSite=Lax','Max-Age=604800'])expect(header).toContain(attribute)
 expect(await current.read(null)).toBeNull()
 for(const malformed of ['session=malformed','session=%E0%A4%A','session=','not-session=x'])expect(await current.read(malformed)).toBeNull()
 expect(await current.read(request.replace(/.$/,character=>character==='x'?'y':'x'))).toBeNull()
 const rotated=recipe(['test-next-secret','test-current-secret'],()=>now)
 expect(await rotated.read(request)).toEqual({userId:'u1'})
 const newHeader=await rotated.write({userId:'u2'})
 expect(await current.read(asRequest(newHeader))).toBeNull()
 const retired=recipe(['test-next-secret'],()=>now)
 expect(await retired.read(request)).toBeNull()
 expect(await retired.read(asRequest(newHeader))).toEqual({userId:'u2'})
 now+=604800_000
 // Keeping a cookie past browser Max-Age does not bypass the recipe's exp check.
 expect(await current.cookie.parse(request)).not.toBeNull()
 expect(await current.read(request)).toBeNull()
 const wrongExpiry=await current.cookie.serialize(JSON.stringify({data:{userId:'u1'},exp:'not-a-number'}))
 expect(await current.read(asRequest(wrongExpiry))).toBeNull()
 const badJson=await current.cookie.serialize('not-json')
 expect(await current.read(asRequest(badJson))).toBeNull()
 const cleared=await current.clear()
 expect(cleared).toContain('Max-Age=0')
 expect(await current.read(asRequest(cleared))).toBeNull()
},30000)
