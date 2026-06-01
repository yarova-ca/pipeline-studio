Rails.application.routes.draw do
  root 'health#hello'
  get '/health', to: 'health#health'
  get '/health/live', to: 'health#liveness'
  get '/health/ready', to: 'health#readiness'
end
