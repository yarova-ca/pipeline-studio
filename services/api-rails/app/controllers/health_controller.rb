require_relative '../../lib/compliance'

class HealthController < ActionController::API
  def hello
    render json: { message: 'Hello from Rails 8.0', framework: '22-rails', version: '1.0.0' }
  end

  # The active industry profile and the controls in effect. Switch with
  # COMPLIANCE_PROFILE — the controls flip at boot, no rebuild.
  def compliance
    c = Compliance.active
    render json: {
      profile: c[:profile],
      controls: {
        auditLogging: c[:audit_logging],
        sessionTimeoutSeconds: c[:session_timeout_seconds],
        mfaRequired: c[:mfa_required],
        encryptionInTransit: c[:encryption_in_transit]
      },
      required: c[:required]
    }
  end

  def health
    render json: { status: 'ok', version: '1.0.0' }
  end

  def liveness
    render json: { status: 'ok' }
  end

  # DB-checking readiness probe.
  # Returns 503 when the database is unreachable so k8s removes the pod
  # from the load balancer until the connection recovers.
  def readiness
    ActiveRecord::Base.connection.execute('SELECT 1')
    render json: { status: 'ok', db: 'connected' }
  rescue StandardError => e
    Rails.logger.error("health/ready db check failed: #{e.message}")
    render json: { status: 'error', db: 'disconnected' }, status: :service_unavailable
  end
end
