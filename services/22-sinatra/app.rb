require 'sinatra'
require 'sinatra/json'
require 'dotenv/load'

set :port, (ENV['PORT'] || 3000).to_i
set :bind, '0.0.0.0'

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
  json status: 'ok'
end
