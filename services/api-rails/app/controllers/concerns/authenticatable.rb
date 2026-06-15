module Authenticatable
  extend ActiveSupport::Concern

  included do
    before_action :require_auth
  end

  private

  # Sets @current_user from JWT Bearer token or X-API-Key header.
  # On failure: renders 401 and returns.
  def require_auth
    @current_user = authenticate_request
    render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_user
  end

  def authenticate_request
    try_jwt || try_api_key
  end

  def try_jwt
    header = request.headers['Authorization']
    return nil unless header&.start_with?('Bearer ')

    token = header.sub('Bearer ', '')
    payload = JwtService.decode(token)
    return nil unless payload

    User.find_by(id: payload[:sub])
  end

  def try_api_key
    key = request.headers['X-API-Key']
    return nil unless key.present?

    User.find_by(api_key: key)
  end
end
