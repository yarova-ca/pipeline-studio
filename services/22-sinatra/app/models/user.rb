require_relative '../db/db'

class User < Sequel::Model(:users)
  plugin :timestamps
  plugin :validation_helpers

  def validate
    super
    validates_presence [:email, :name]
    validates_unique :email
  end

  def self.find_by_api_key(key)
    where(api_key: key).first
  end
end
