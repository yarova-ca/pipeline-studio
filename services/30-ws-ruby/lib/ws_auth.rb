require_relative 'jwt_service'
require_relative '../app/models/user'

# WebSocket auth — validates auth on the HTTP upgrade request.
#
# WebSocket clients cannot set custom headers in browser WebSocket API.
# Two auth paths are supported:
#
#   1. Authorization: Bearer <JWT> in the upgrade headers (server clients).
#   2. ?token=<JWT> query parameter in the WebSocket URL (browser clients).
#
# On valid auth: returns User record.
# On missing or invalid auth: returns nil. Caller closes the connection.

module WsAuth
  def self.authenticate(env)
    try_jwt(env) || try_token_param(env) || try_api_key(env)
  end

  private_class_method def self.try_jwt(env)
    header = env['HTTP_AUTHORIZATION']
    return nil unless header&.start_with?('Bearer ')

    token = header.sub('Bearer ', '')
    payload = JwtService.decode(token)
    return nil unless payload

    User.find_by(id: payload[:sub])
  end

  private_class_method def self.try_token_param(env)
    # Parse ?token= from the upgrade URL query string.
    query = env['QUERY_STRING'] || ''
    params = URI.decode_www_form(query).to_h
    token = params['token']
    return nil unless token

    payload = JwtService.decode(token)
    return nil unless payload

    User.find_by(id: payload[:sub])
  end

  private_class_method def self.try_api_key(env)
    key = env['HTTP_X_API_KEY']
    return nil unless key&.present?

    User.find_by(api_key: key)
  end
end
