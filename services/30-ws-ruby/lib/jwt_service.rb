require 'jwt'

class JwtService
  ALGORITHM = 'HS256'.freeze
  TTL_SECONDS = 8 * 60 * 60 # 8 hours

  def self.encode(payload)
    exp = Time.now.to_i + TTL_SECONDS
    claims = payload.merge(exp: exp, iat: Time.now.to_i)
    JWT.encode(claims, secret, ALGORITHM)
  end

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
