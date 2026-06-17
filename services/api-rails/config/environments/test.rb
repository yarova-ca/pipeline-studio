Rails.application.configure do
  config.eager_load = false
  config.consider_all_requests_local = true
  config.log_level = :warn
  config.secret_key_base = ENV['SECRET_KEY_BASE'] || ENV['JWT_SECRET'] || 'test'
  config.hosts.clear

  # Surface raw exceptions in request specs instead of rendering error pages,
  # so failing assertions show the real cause.
  config.action_dispatch.show_exceptions = :none
  config.active_support.deprecation = :stderr
end
