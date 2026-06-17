require_relative '../../lib/jwt_service'

class AuthController < ActionController::API
  include Authenticatable

  GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'.freeze
  GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'.freeze
  GITHUB_USER_URL = 'https://api.github.com/user'.freeze

  # Skip global require_auth for unauthenticated routes.
  skip_before_action :require_auth, only: %i[login callback dev_token]

  # GET /auth/login — redirect to GitHub OAuth
  def login
    params_str = URI.encode_www_form(
      client_id: ENV['GITHUB_CLIENT_ID'],
      redirect_uri: ENV['GITHUB_CALLBACK_URL'],
      scope: 'user:email'
    )
    redirect_to "#{GITHUB_AUTH_URL}?#{params_str}", allow_other_host: true
  end

  # GET /auth/callback — exchange code, upsert user, return JWT
  def callback
    code = params[:code]
    return render json: { error: 'Missing OAuth code' }, status: :bad_request unless code

    access_token = exchange_code(code)
    return render json: { error: 'GitHub token exchange failed' }, status: :bad_gateway unless access_token

    gh_user = fetch_github_user(access_token)
    return render json: { error: 'GitHub user fetch failed' }, status: :bad_gateway unless gh_user

    user = upsert_from_github(gh_user)
    token = JwtService.encode({ sub: user.id, email: user.email, name: user.name })
    render json: { token: token, user: user_json(user) }
  end

  # GET /auth/me — return current user (require_auth runs via before_action)
  def me
    render json: { user: user_json(@current_user) }
  end

  # POST /auth/logout — stateless JWT; client discards token
  def logout
    render json: { message: 'Logged out' }
  end

  # POST /auth/api-key — regenerate API key
  def create_api_key
    @current_user.regenerate_api_key!
    render json: { api_key: @current_user.api_key }
  end

  # DELETE /auth/api-key — revoke API key
  def delete_api_key
    @current_user.update!(api_key: nil)
    render json: { message: 'API key revoked' }
  end

  # POST /dev/token — development-only token
  def dev_token
    unless Rails.env.development?
      return render json: { error: 'Not found' }, status: :not_found
    end

    user_id = params[:user_id] || 'dev-user-id'
    email = params[:email] || 'dev@example.com'
    name = params[:name] || 'Dev User'
    token = JwtService.encode({ sub: user_id, email: email, name: name })
    render json: { token: token }
  end

  private

  def exchange_code(code)
    uri = URI(GITHUB_TOKEN_URL)
    response = Net::HTTP.post_form(uri, {
      client_id: ENV['GITHUB_CLIENT_ID'],
      client_secret: ENV['GITHUB_CLIENT_SECRET'],
      code: code
    })
    body = JSON.parse(response.body) rescue {}
    body['access_token']
  end

  def fetch_github_user(access_token)
    uri = URI(GITHUB_USER_URL)
    req = Net::HTTP::Get.new(uri)
    req['Authorization'] = "Bearer #{access_token}"
    req['Accept'] = 'application/json'
    req['User-Agent'] = 'rails-app'

    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
    JSON.parse(res.body) rescue nil
  end

  def upsert_from_github(gh_user)
    email = gh_user['email'] || "#{gh_user['login']}@github.invalid"
    user = User.find_or_initialize_by(email: email)
    user.assign_attributes(
      name: gh_user['name'] || gh_user['login'],
      provider: 'github'
    )
    user.save!
    user
  end

  def user_json(user)
    { id: user.id, email: user.email, name: user.name, provider: user.provider }
  end
end
