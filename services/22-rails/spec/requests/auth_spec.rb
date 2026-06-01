require 'rails_helper'

RSpec.describe AuthController, type: :request do
  let(:user) do
    User.create!(
      email: 'test@example.com',
      name: 'Test User',
      provider: 'github'
    )
  end

  let(:valid_token) do
    JwtService.encode({ sub: user.id, email: user.email, name: user.name })
  end

  describe 'GET /auth/me' do
    context 'with no auth header' do
      it 'returns 401' do
        get '/auth/me'
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end

    context 'with a valid JWT Bearer token' do
      it 'returns 200 and current user' do
        get '/auth/me', headers: { 'Authorization' => "Bearer #{valid_token}" }
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body.dig('user', 'email')).to eq('test@example.com')
      end
    end

    context 'with a valid X-API-Key header' do
      it 'returns 200 and current user' do
        get '/auth/me', headers: { 'X-API-Key' => user.api_key }
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body.dig('user', 'email')).to eq('test@example.com')
      end
    end

    context 'with an invalid JWT' do
      it 'returns 401' do
        get '/auth/me', headers: { 'Authorization' => 'Bearer not.a.real.token' }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with a wrong API key' do
      it 'returns 401' do
        get '/auth/me', headers: { 'X-API-Key' => 'wrong-key' }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'POST /auth/logout' do
    it 'returns 200 regardless of auth state' do
      post '/auth/logout', headers: { 'Authorization' => "Bearer #{valid_token}" }
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /auth/api-key' do
    context 'with valid auth' do
      it 'returns a new api_key' do
        post '/auth/api-key', headers: { 'Authorization' => "Bearer #{valid_token}" }
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['api_key']).to be_present
        expect(body['api_key']).not_to eq(user.api_key)
      end
    end

    context 'without auth' do
      it 'returns 401' do
        post '/auth/api-key'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /auth/api-key' do
    context 'with valid auth' do
      it 'revokes the api_key' do
        delete '/auth/api-key', headers: { 'Authorization' => "Bearer #{valid_token}" }
        expect(response).to have_http_status(:ok)
        user.reload
        expect(user.api_key).to be_nil
      end
    end

    context 'without auth' do
      it 'returns 401' do
        delete '/auth/api-key'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
