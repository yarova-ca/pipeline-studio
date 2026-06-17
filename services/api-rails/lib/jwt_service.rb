require 'jwt'
require_relative 'compliance'

class JwtService
  ALGORITHM = 'HS256'.freeze

  # Fallback token lifetime when the active profile sets no timeout (value 0).
  DEFAULT_TTL_SECONDS = 86_400

  def self.encode(payload)
    # Session length is set by the active industry profile (HIPAA → 15 min).
    # The value lives under the profile controls; 0 means "no profile-imposed
    # limit", so fall back to the default lifetime to keep tokens valid.
    claims = payload.merge(exp: Time.now.to_i + ttl_seconds, iat: Time.now.to_i)
    JWT.encode(claims, secret, ALGORITHM)
  end

  def self.ttl_seconds
    configured = Compliance.active[:controls]['session_timeout_seconds'].to_i
    configured.positive? ? configured : DEFAULT_TTL_SECONDS
  end
  private_class_method :ttl_seconds

  def self.decode(token)
    decoded = JWT.decode(token, secret, true, algorithm: ALGORITHM)
    decoded.first.transform_keys(&:to_sym)
  rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError
    nil
  end

  def self.secret
    ENV.fetch('SECRET_KEY_BASE') do
      raise 'SECRET_KEY_BASE environment variable is not set'
    end
  end
  private_class_method :secret
end
