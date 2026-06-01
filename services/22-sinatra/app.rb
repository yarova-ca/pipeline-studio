require 'sinatra'
require 'sinatra/json'
require 'dotenv/load'
require 'sequel'
require 'json'
require_relative 'lib/jwt_service'

set :port,    (ENV['PORT'] || 3000).to_i
set :bind,    '0.0.0.0'
set :show_exceptions, false

# ── Database ──────────────────────────────────────────────────────────────
# Connect when DATABASE_URL is present; skip in health-only mode.
DB = if ENV['DATABASE_URL']
  Sequel.connect(ENV['DATABASE_URL'])
else
  Sequel.sqlite # in-memory SQLite for development
end

# Bootstrap tables if they don't exist (development / test mode).
unless DB.table_exists?(:users)
  DB.create_table(:users) do
    primary_key :id, type: :String, size: 36
    String      :email, null: false, unique: true
    String      :name,  null: false
    String      :api_key, unique: true
    String      :provider, null: false, default: 'github'
    DateTime    :created_at, default: Sequel::CURRENT_TIMESTAMP
    DateTime    :updated_at, default: Sequel::CURRENT_TIMESTAMP
  end
end

unless DB.table_exists?(:items)
  DB.create_table(:items) do
    primary_key :id, type: :String, size: 36
    String      :title, null: false
    String      :description, text: true
    String      :user_id, null: false
    index       :user_id
    DateTime    :created_at, default: Sequel::CURRENT_TIMESTAMP
    DateTime    :updated_at, default: Sequel::CURRENT_TIMESTAMP
  end
end

Users = DB[:users]
Items = DB[:items]

# ── Auth helpers ──────────────────────────────────────────────────────────

# Resolve the current user from:
# 1. Authorization: Bearer <JWT>
# 2. X-API-Key header → DB lookup
# Returns user hash or nil.
def resolve_user(req)
  auth_header = req.env['HTTP_AUTHORIZATION']
  if auth_header&.start_with?('Bearer ')
    token  = auth_header.sub('Bearer ', '').strip
    claims = JwtService.decode(token)
    return nil unless claims

    user_id = claims[:sub]
    return Users.where(id: user_id).first
  end

  api_key = req.env['HTTP_X_API_KEY']
  if api_key && !api_key.empty?
    return Users.where(api_key: api_key).first
  end

  nil
end

# Halt with 401 when user not authenticated.
def require_auth
  user = resolve_user(request)
  halt 401, json(error: 'Unauthorized') unless user
  user
end

# ── Core routes ───────────────────────────────────────────────────────────

get '/' do
  json message: 'Hello from Sinatra 4.0', framework: '22-sinatra', version: '1.0.0'
end

get '/health' do
  json status: 'ok', version: '1.0.0'
end

get '/health/live' do
  json status: 'ok'
end

get '/health/ready' do
  begin
    DB.test_connection
    json status: 'ok', db: 'connected'
  rescue StandardError
    status 503
    json status: 'error', db: 'disconnected'
  end
end

# ── Auth routes ───────────────────────────────────────────────────────────

# GET /auth/login — redirect to GitHub OAuth.
get '/auth/login' do
  client_id   = ENV['GITHUB_CLIENT_ID']    || ''
  redirect_uri = ENV['GITHUB_REDIRECT_URI'] || ''
  url = "https://github.com/login/oauth/authorize" \
        "?client_id=#{CGI.escape(client_id)}" \
        "&redirect_uri=#{CGI.escape(redirect_uri)}" \
        "&scope=user:email"
  redirect url
end

# GET /auth/callback — exchange code, upsert user, return JWT.
get '/auth/callback' do
  code = params[:code]
  halt 400, json(error: 'Missing code') if code.nil? || code.empty?

  require 'net/http'
  require 'uri'
  require 'cgi'

  # Exchange code for access token.
  token_uri = URI('https://github.com/login/oauth/access_token')
  token_res = Net::HTTP.post_form(token_uri, {
    client_id:     ENV['GITHUB_CLIENT_ID']     || '',
    client_secret: ENV['GITHUB_CLIENT_SECRET'] || '',
    code:          code
  })
  token_body = JSON.parse(token_res.body) rescue {}
  access_token = token_body['access_token']
  halt 401, json(error: 'GitHub token exchange failed') unless access_token

  # Fetch GitHub user.
  user_uri = URI('https://api.github.com/user')
  user_req = Net::HTTP::Get.new(user_uri)
  user_req['Authorization'] = "Bearer #{access_token}"
  user_req['Accept']        = 'application/json'
  user_req['User-Agent']    = 'sinatra-app'
  user_res = Net::HTTP.start(user_uri.hostname, user_uri.port, use_ssl: true) { |h| h.request(user_req) }
  gh_user  = JSON.parse(user_res.body) rescue nil
  halt 401, json(error: 'GitHub profile fetch failed') unless gh_user

  email = gh_user['email'] || "#{gh_user['login']}@github.noemail"
  name  = gh_user['name']  || gh_user['login']

  # Upsert user.
  existing = Users.where(email: email).first
  if existing
    Users.where(email: email).update(name: name, updated_at: Time.now)
    user_id = existing[:id]
  else
    user_id = SecureRandom.uuid
    Users.insert(id: user_id, email: email, name: name, provider: 'github',
                 created_at: Time.now, updated_at: Time.now)
  end

  token = JwtService.encode(sub: user_id, email: email, name: name)
  json token: token
end

# GET /auth/me — return current user.
get '/auth/me' do
  user = require_auth
  json id: user[:id], email: user[:email], name: user[:name]
end

# POST /auth/logout — stateless JWT; no server-side action.
post '/auth/logout' do
  json status: 'ok'
end

# POST /auth/api-key — generate and save API key.
post '/auth/api-key' do
  user   = require_auth
  api_key = SecureRandom.hex(32)
  Users.where(id: user[:id]).update(api_key: api_key, updated_at: Time.now)
  json api_key: api_key
end

# DELETE /auth/api-key — revoke API key.
delete '/auth/api-key' do
  user = require_auth
  Users.where(id: user[:id]).update(api_key: nil, updated_at: Time.now)
  json status: 'ok'
end

# POST /dev/token — dev-only; no OAuth.
post '/dev/token' do
  env_name = ENV['APP_ENV'] || ENV['RACK_ENV'] || 'development'
  halt 403, json(error: 'Not available') if env_name == 'production'

  body_params = JSON.parse(request.body.read) rescue {}
  email       = body_params['email'] || 'dev@example.com'
  name        = body_params['name']  || 'Dev User'

  existing = Users.where(email: email).first
  user_id  = if existing
    existing[:id]
  else
    id = SecureRandom.uuid
    Users.insert(id: id, email: email, name: name, provider: 'dev',
                 created_at: Time.now, updated_at: Time.now)
    id
  end

  token = JwtService.encode(sub: user_id, email: email, name: name)
  json token: token
end

# ── User items routes ─────────────────────────────────────────────────────

# GET /users/me/items
get '/users/me/items' do
  user  = require_auth
  items = Items.where(user_id: user[:id]).order(Sequel.desc(:created_at)).all
  json items: items
end

# POST /users/me/items
post '/users/me/items' do
  user   = require_auth
  params = JSON.parse(request.body.read) rescue {}
  title  = params['title']
  halt 400, json(error: 'title is required') if title.nil? || title.strip.empty?

  item_id = SecureRandom.uuid
  now     = Time.now
  Items.insert(
    id:          item_id,
    title:       title.strip,
    description: params['description'],
    user_id:     user[:id],
    created_at:  now,
    updated_at:  now
  )
  status 201
  json Items.where(id: item_id).first
end

# GET /users/me/items/:id
get '/users/me/items/:id' do
  user = require_auth
  item = Items.where(id: params[:id], user_id: user[:id]).first
  halt 404, json(error: 'Item not found') unless item
  json item
end

# PUT /users/me/items/:id
put '/users/me/items/:id' do
  user = require_auth
  item = Items.where(id: params[:id], user_id: user[:id]).first
  halt 404, json(error: 'Item not found') unless item

  body_params = JSON.parse(request.body.read) rescue {}
  updates = { updated_at: Time.now }
  updates[:title]       = body_params['title']       if body_params.key?('title') && !body_params['title'].to_s.strip.empty?
  updates[:description] = body_params['description'] if body_params.key?('description')

  Items.where(id: params[:id]).update(updates)
  json Items.where(id: params[:id]).first
end

# DELETE /users/me/items/:id
delete '/users/me/items/:id' do
  user = require_auth
  item = Items.where(id: params[:id], user_id: user[:id]).first
  halt 404, json(error: 'Item not found') unless item
  Items.where(id: params[:id]).delete
  status 204
end
