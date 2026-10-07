export async function pullAfterTransportDeath(iterator: AsyncIterator<unknown>, cut: () => void) {
  const next = iterator.next().then(
    (value) => ({ outcome: "resolved", value }),
    (error) => ({ outcome: "rejected", message: error.message }),
  );
  // Close or error the response body while next() is pending.
  cut();
  // Both paths leave this pull pending instead of rejecting it.
  return Promise.race([
    next,
    new Promise((resolve) => setTimeout(() => resolve({ outcome: "pending" }), 300)),
  ]);
}
