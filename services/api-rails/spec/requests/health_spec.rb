require 'rails_helper'

RSpec.describe HealthController, type: :request do
  it 'GET / returns hello' do
    get '/'
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)['message']).to include('Rails')
  end

  it 'GET /health returns ok' do
    get '/health'
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)['status']).to eq('ok')
  end

  it 'GET /health/live returns ok' do
    get '/health/live'
    expect(response).to have_http_status(:ok)
  end

  it 'GET /health/ready returns ok' do
    get '/health/ready'
    expect(response).to have_http_status(:ok)
  end
end
