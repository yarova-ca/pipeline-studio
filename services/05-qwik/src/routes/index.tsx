import { component$ } from '@builder.io/qwik'
import { type DocumentHead } from '@builder.io/qwik-city'

export default component$(() => {
  return (
    <main>
      <h1>Hello from Qwik 2.0</h1>
      <p>Framework: 05-qwik</p>
    </main>
  )
})

export const head: DocumentHead = { title: 'Qwik 2.0' }
