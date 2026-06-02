import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(process.env.PORT ?? 3000)
  console.log(`NestJS running on port ${process.env.PORT ?? 3000}`)
}
bootstrap()

// Graceful shutdown — drains in-flight requests before exiting.
process.on('SIGTERM', () => {
  const srv = (global as any).__server
  if (srv) srv.close(() => process.exit(0))
  else process.exit(0)
})
