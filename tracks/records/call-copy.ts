// Intentionally no framework import: a non-Solid caller sees the registered
// records channel rather than bringing another core/engine into its bundle.
import {createServerReference,configureServerFunctionsClient} from '@solidjs/web/server-functions/client'
export async function run(){configureServerFunctionsClient({fetch:()=>Response.json(7,{headers:{'X-Server-Function-Format':'8'}})});try{return await createServerReference('copy-call')()}finally{configureServerFunctionsClient({fetch:null})}}
