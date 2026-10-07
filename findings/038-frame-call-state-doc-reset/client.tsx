import {createSignal,Loading,flush} from "solid-js";
import {render,dynamic} from "@solidjs/web";
import {createServerReference} from "@solidjs/web/server-functions/client";
import {installServerComponents} from "@solidjs/web/frames";
installServerComponents();
const get=createServerReference("state-reset");const [id,setId]=createSignal(1);
const Component=dynamic(()=>get(id()) as any);
function Counter(){const [count,setCount]=createSignal(0);return <button data-inside onClick={()=>setCount(n=>n+1)}>{count()}</button>}
function App(){const [outside,setOutside]=createSignal(0);return <><button data-outside onClick={()=>setOutside(n=>n+1)}>{outside()}</button><Loading fallback="pending"><Component counter={Counter}/></Loading></>}
render(App,document.getElementById("root")!);
(window as any).change=()=>{setId(2);flush()};
