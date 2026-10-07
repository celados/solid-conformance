import {render} from "@solidjs/web";
import {installServerComponents} from "@solidjs/web/frames";
installServerComponents();
render(()=>document.createElement("p"),document.body);
