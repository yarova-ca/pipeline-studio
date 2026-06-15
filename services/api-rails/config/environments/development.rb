Rails.application.configure do
  config.eager_load = false
  config.consider_all_requests_local = true
  config.log_level = :debug
  config.secret_key_base = ENV['SECRET_KEY_BASE'] || ENV['JWT_SECRET'] || 'dev'
  config.hosts.clear
end
