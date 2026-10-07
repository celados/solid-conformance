export async function story(id:number){
 'use server'
 return ()=> <h1>server-only-marker-{id}</h1>
}
