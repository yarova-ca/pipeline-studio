import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { AppController } from './app.controller'
import { HealthController } from './health/health.controller'

@Module({
  imports: [TerminusModule],
  controllers: [AppController, HealthController],
})
export class AppModule {}
