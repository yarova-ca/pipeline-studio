class User < ApplicationRecord
  has_many :items, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :name, presence: true
  validates :provider, presence: true

  before_create :generate_api_key

  def regenerate_api_key!
    update!(api_key: SecureRandom.hex(32))
  end

  private

  def generate_api_key
    self.api_key = SecureRandom.hex(32)
  end
end
