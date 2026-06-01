import express from 'express'
import 'dotenv/config'

const app = express()
const PORT = Number(process.env.PORT ?? '3000')

app.get('/', (_req, res) => {
  res.json({ message: 'Hello from Express 5.0', framework: '14-express', version: '1.0.0' })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' })
})

app.get('/health/live', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/health/ready', (_req, res) => {
  res.json({ status: 'ok' })
})

export const server = app.listen(PORT, () => {
  console.log(`Express running on port ${PORT}`)
})

export default app
