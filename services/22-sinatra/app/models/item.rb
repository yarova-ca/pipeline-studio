require_relative '../db/db'

class Item < Sequel::Model(:items)
  plugin :timestamps

  many_to_one :user

  def validate
    super
    validates_presence [:title, :user_id]
    validates_max_length 500, :title
  end
end
