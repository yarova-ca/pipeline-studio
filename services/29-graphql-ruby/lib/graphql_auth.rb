require_relative 'jwt_service'
require_relative '../app/models/user'

# GraphQL auth helper — extracts current user from Rack request.
#
# Resolution order:
#   1. Authorization: Bearer <JWT> header — verified without a DB hit.
#   2. X-API-Key header — DB lookup.
#
# On auth success: returns User record.
# On auth failure: returns nil.
#   GraphQL resolvers must check context[:current_user] and raise GraphQL::ExecutionError.
#
# Usage in schema context:
#   context: { current_user: GraphqlAuth.authenticate(request) }

module GraphqlAuth
  def self.authenticate(request)
    try_jwt(request) || try_api_key(request)
  end

  def self.try_jwt(request)
    header = request.env['HTTP_AUTHORIZATION']
    return nil unless header&.start_with?('Bearer ')

    token = header.sub('Bearer ', '')
    payload = JwtService.decode(token)
    return nil unless payload

    User.find_by(id: payload[:sub])
  end

  def self.try_api_key(request)
    key = request.env['HTTP_X_API_KEY']
    return nil unless key.present?

    User.find_by(api_key: key)
  end
end
