Rails.application.configure do
  config.eager_load = true
  config.consider_all_requests_local = false
  config.log_level = :info
  config.secret_key_base = ENV['SECRET_KEY_BASE'] || ENV['JWT_SECRET']
  config.active_record.dump_schema_after_migration = false
  config.hosts.clear

  # I-12: structured logs go to stdout, never a file, in a container.
  config.logger = ActiveSupport::Logger.new($stdout)
end
