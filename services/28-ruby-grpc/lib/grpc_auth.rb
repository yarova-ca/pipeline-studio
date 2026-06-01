require_relative 'jwt_service'
require_relative '../app/models/user'

# gRPC auth interceptor — validates JWT or API key from gRPC metadata.
#
# gRPC metadata is the equivalent of HTTP headers.
# Clients send: metadata['authorization'] = 'Bearer <token>'
#               metadata['x-api-key'] = '<key>'
#
# On valid JWT: sets call.metadata[:current_user], calls continuation.
# On valid API key: DB lookup, sets current_user, calls continuation.
# On missing or invalid credential: raises GRPC::Unauthenticated.

class GrpcAuth < GRPC::ServerInterceptor
  def request_response(request:, call:, method:)
    authenticate!(call)
    yield
  end

  def client_streamer(call:, method:)
    authenticate!(call)
    yield
  end

  def server_streamer(request:, call:, method:)
    authenticate!(call)
    yield
  end

  def bidi_streamer(requests:, call:, method:)
    authenticate!(call)
    yield
  end

  private

  def authenticate!(call)
    metadata = call.metadata

    # --- Attempt 1: Bearer JWT ---
    auth_header = metadata['authorization']
    if auth_header&.start_with?('Bearer ')
      token = auth_header.sub('Bearer ', '')
      payload = JwtService.decode(token)
      if payload
        user = User.find_by(id: payload[:sub])
        raise GRPC::Unauthenticated, 'User not found' unless user

        call.metadata[:current_user] = user
        return
      end
      raise GRPC::Unauthenticated, 'Invalid or expired JWT token'
    end

    # --- Attempt 2: X-API-Key ---
    api_key = metadata['x-api-key']
    if api_key.present?
      user = User.find_by(api_key: api_key)
      raise GRPC::Unauthenticated, 'Invalid API key' unless user

      call.metadata[:current_user] = user
      return
    end

    raise GRPC::Unauthenticated, 'Authentication required. Provide Bearer token or x-api-key metadata.'
  end
end
