require 'jwt'

# JwtService — sign and verify HS256 tokens.
#
# Algorithm: HS256
# Expiry: 8 hours
# Secret source: JWT_SECRET environment variable
module JwtService
  ALGORITHM = 'HS256'
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
    ENV.fetch('JWT_SECRET') do
      raise 'JWT_SECRET environment variable is not set'
    end
  end
  private_class_method :secret
end
