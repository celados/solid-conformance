import { Loading } from "solid-js";
import { dynamic, isServer } from "@solidjs/web";
import { story } from "./api";
export const statuses: string[] = [];
export function App() {
  const Story = dynamic(() => {
    const source: any = story();
    if (!isServer) source.onstatus = (status: string) => statuses.push(status);
    return source;
  });
  return (
    <Loading fallback={<i>waiting</i>}>
      <Story />
    </Loading>
  );
}
