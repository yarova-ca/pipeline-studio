Rails.application.routes.draw do
  root 'health#hello'
  get '/health', to: 'health#health'
  get '/health/live', to: 'health#liveness'
  get '/health/ready', to: 'health#readiness'
  get '/compliance', to: 'health#compliance'

  scope '/auth' do
    get  'login',    to: 'auth#login'
    get  'callback', to: 'auth#callback'
    get  'me',       to: 'auth#me'
    post 'logout',   to: 'auth#logout'
    post 'api-key',  to: 'auth#create_api_key'
    delete 'api-key', to: 'auth#delete_api_key'
  end

  if Rails.env.development?
    post '/dev/token', to: 'auth#dev_token'
  end

  resources :items, controller: 'user_items', except: %i[new edit]

  # OpenAPI docs via rswag — spec at /api-docs/v1/swagger.json, UI at /api-docs
  mount Rswag::Ui::Engine => '/api-docs'
  mount Rswag::Api::Engine => '/api-docs'
end
