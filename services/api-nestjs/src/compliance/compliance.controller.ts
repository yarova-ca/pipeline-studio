import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '../common/public.decorator'
import { compliance } from './compliance'

// Reports the industry profile this deployment is running under, and the
// controls in effect. Switch the profile with COMPLIANCE_PROFILE; this
// endpoint proves the controls changed — no code change, no rebuild.
@ApiTags('compliance')
@Controller('compliance')
export class ComplianceController {
  @Public()
  @Get()
  current() {
    return {
      profile: compliance.profile,
      controls: {
        auditLogging: compliance.auditLogging,
        sessionTimeoutSeconds: compliance.sessionTimeoutSeconds,
        mfaRequired: compliance.mfaRequired,
        encryptionInTransit: compliance.encryptionInTransit,
      },
      required: compliance.required,
    }
  }
}
