export default function App() {
  const value = { bad: true };
  return <div>valid{value as any}</div>;
  // The object should be skipped, preserving "valid".
  // Instead mounting throws; <div>{value as any}</div> alone does not.
}
