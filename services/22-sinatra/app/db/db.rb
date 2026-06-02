# Sequel ORM setup for Sinatra service.
# Sequel: Ruby ORM — simpler than ActiveRecord, works without Rails.
require 'sequel'

DB = Sequel.connect(ENV['DATABASE_URL'] || 'postgres://localhost/sinatra_dev')
DB.loggers << Logger.new($stdout)

# User table migration (run once: ruby db/migrate.rb)
# DB.create_table?(:users) do
#   String :id, primary_key: true
#   String :email, unique: true, null: false
#   String :name, null: false
#   String :api_key
#   String :provider, default: 'local'
#   DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
#   DateTime :updated_at, default: Sequel::CURRENT_TIMESTAMP
# end
