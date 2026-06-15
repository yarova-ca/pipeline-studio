import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { AppController } from './app.controller'
import { HealthController } from './health/health.controller'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [TerminusModule, AuthModule, UsersModule],
  controllers: [AppController, HealthController],
})
export class AppModule {}
