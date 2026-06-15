import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller'
import { HealthController } from './health/health.controller'
import { MetricsController } from './common/metrics'
import { ComplianceController } from './compliance/compliance.controller'
import { AuthModule } from './auth/auth.module'
import { AuthGuard } from './auth/auth.guard'
import { UsersModule } from './users/users.module'
import { config } from './config'

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: config.RATE_LIMIT }]), AuthModule, UsersModule],
  controllers: [AppController, HealthController, MetricsController, ComplianceController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
