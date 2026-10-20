'use server'

export async function getPanel() {
  return () => <section id="server-panel">Server panel</section>
}
