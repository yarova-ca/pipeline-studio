require 'spec_helper'

RSpec.describe 'Health endpoints' do
  it 'GET / returns hello' do
    get '/'
    expect(last_response).to be_ok
    expect(JSON.parse(last_response.body)['message']).to include('Sinatra')
  end

  it 'GET /health returns ok' do
    get '/health'
    expect(last_response).to be_ok
    expect(JSON.parse(last_response.body)['status']).to eq('ok')
  end

  it 'GET /health/live returns ok' do
    get '/health/live'
    expect(last_response).to be_ok
  end

  it 'GET /health/ready returns ok' do
    get '/health/ready'
    expect(last_response).to be_ok
  end
end
