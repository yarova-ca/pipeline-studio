import type { MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

export const meta: MetaFunction = () => [{ title: 'Remix 7' }]

export async function loader() {
  return json({ message: 'Hello from Remix 7', framework: '01-remix', version: '1.0.0' })
}

export default function Index() {
  const data = useLoaderData<typeof loader>()
  return <main><h1>{data.message}</h1></main>
}
