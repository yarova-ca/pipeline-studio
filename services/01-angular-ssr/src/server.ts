import { APP_BASE_HREF } from '@angular/common'
import { renderApplication } from '@angular/platform-server'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import bootstrap from './app/app.config.server'

const app = express()
const PORT = process.env.PORT || 4000
const serverDistFolder = dirname(fileURLToPath(import.meta.url))
const browserDistFolder = resolve(serverDistFolder, '../browser')

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }))
app.get('/health/live', (_req, res) => res.json({ status: 'ok' }))
app.get('/health/ready', (_req, res) => res.json({ status: 'ok' }))

app.use(express.static(browserDistFolder, { maxAge: '1y' }))

app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req
  renderApplication(bootstrap, {
    document: '<app-root></app-root>',
    url: `${protocol}://${headers.host}${originalUrl}`,
    platformProviders: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
  }).then(html => res.send(html)).catch(err => next(err))
})

app.listen(PORT, () => console.log(`Angular SSR running on port ${PORT}`))
