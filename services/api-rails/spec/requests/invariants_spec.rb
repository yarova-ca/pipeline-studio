require 'rails_helper'

# Invariant suite — each example maps to a Yarova invariant by I-id.
# Mirrors the idioms in spec/requests/auth_spec.rb and user_items_spec.rb:
# request specs, JwtService.encode for tokens, have_http_status matchers.
RSpec.describe 'Invariants', type: :request do
  let(:user) do
    User.create!(
      email: 'invariants-user@example.com',
      name: 'Invariants User',
      provider: 'github'
    )
  end

  let(:valid_token) do
    JwtService.encode({ sub: user.id, email: user.email, name: user.name })
  end

  let(:auth_headers) do
    { 'Authorization' => "Bearer #{valid_token}" }
  end

  # I-3: GET a protected route with NO Authorization header → 401
  describe 'I-3: missing auth header on a protected route' do
    it 'returns 401' do
      get '/auth/me'
      expect(response).to have_http_status(:unauthorized)
    end
  end

  # I-4: GET a protected route with a garbage/tampered Bearer token → 401
  describe 'I-4: tampered bearer token on a protected route' do
    it 'returns 401' do
      get '/auth/me', headers: { 'Authorization' => 'Bearer not.a.real.token' }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  # I-6: POST with a VALID token + an unknown extra body field → 400
  describe 'I-6: unknown body field is rejected' do
    it 'returns 400 when an unknown field is present' do
      post '/items',
        params: { title: 'Valid Title', surprise_field: 'nope' },
        headers: auth_headers
      expect(response).to have_http_status(:bad_request)
    end
  end

  # I-10: GET /health/live → 200
  describe 'I-10: liveness probe' do
    it 'returns 200' do
      get '/health/live'
      expect(response).to have_http_status(:ok)
    end
  end

  # I-13: GET /metrics → 200 and body contains the request-duration metric.
  # Prometheus::Middleware::Collector exposes http_server_request_duration_seconds.
  describe 'I-13: prometheus metrics endpoint' do
    it 'returns 200 and exposes the request-duration golden-signal metric' do
      get '/metrics'
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('http_server_request_duration_seconds')
    end
  end

  # I-17: a response carries security header X-Content-Type-Options: nosniff
  describe 'I-17: security header on responses' do
    it 'sets X-Content-Type-Options: nosniff' do
      get '/health/live'
      expect(response.headers['X-Content-Type-Options']).to eq('nosniff')
    end
  end
end
