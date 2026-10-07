import {remainingRenderCases} from './remaining-render-cases'
const selected=remainingRenderCases.find(row=>row.id==='03/client-error-owner-path')!
;(window as unknown as {ownerPathCheck:()=>Promise<string>}).ownerPathCheck=async()=>{await selected.run();return 'passed'}
