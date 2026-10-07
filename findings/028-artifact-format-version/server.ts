import { captureArtifact } from '@solidjs/diagnostics'
export async function version(){return (await captureArtifact(()=>0,{attribution:false})).artifact.formatVersion}
