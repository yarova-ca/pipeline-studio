# Rails-aware spec helper. Required by request specs that boot the app.
# Loaded only by specs that `require 'rails_helper'`, so non-Rails specs
# (e.g. compliance_spec) stay fast and DB-free.

ENV['RAILS_ENV'] ||= 'test'

# config/application.rb aborts the boot unless JWT_SECRET is >= 32 chars, and
# JwtService reads SECRET_KEY_BASE. Provide deterministic test values up front
# so the app boots without external configuration.
ENV['JWT_SECRET'] ||= 'test-jwt-secret-at-least-32-characters-long'
ENV['SECRET_KEY_BASE'] ||= 'test-secret-key-base-at-least-32-characters-long'

require 'spec_helper'
require File.expand_path('../config/environment', __dir__)

# Fail fast if the environment is somehow production — request specs would
# otherwise run against a real database.
abort('The Rails environment is running in production mode!') if Rails.env.production?

require 'rspec/rails'

# JwtService lives in lib/ and is required explicitly by the controllers that
# use it. Specs reference it directly when minting tokens, so require it here
# too rather than depending on controller load order.
require Rails.root.join('lib', 'jwt_service')

# Load the schema into the in-memory SQLite database. The test database is
# `:memory:` (config/database.yml), so it starts empty on every run and must be
# built from db/schema.rb before any example runs.
ActiveRecord::Schema.verbose = false
load Rails.root.join('db', 'schema.rb')

RSpec.configure do |config|
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!
end
