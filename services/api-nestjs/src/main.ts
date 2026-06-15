import 'dotenv/config'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { config } from './config'
import { logger } from './logger'
import { AllExceptionsFilter } from './common/exceptions.filter'
import { requestId } from './common/request-id.middleware'
import { metricsMiddleware } from './common/metrics'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.use(requestId)
  app.use(helmet())
  app.use(metricsMiddleware)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  app.useGlobalFilters(new AllExceptionsFilter())
  app.enableShutdownHooks()
  const doc = new DocumentBuilder().setTitle('Yarova Service').setVersion('1.0.0').addBearerAuth().build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, doc))
  await app.listen(config.PORT)
  logger.info({ port: config.PORT }, 'service started')
}
void bootstrap()
