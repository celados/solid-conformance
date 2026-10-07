// SSR-render and hydrate this component. Dev logs two tag mismatches.
export function Shape(props: { clicked: () => void }) {
  return <div {...{ children: <button onClick={props.clicked}>click</button> }} />;
}
