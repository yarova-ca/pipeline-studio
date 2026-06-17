class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  # Production runs PostgreSQL with native uuid primary keys filled by the
  # database default (gen_random_uuid). SQLite (test) has no such default, so
  # generate the uuid in Ruby when the primary key is a string column and unset.
  # On a uuid-typed primary key this is a no-op — the column type is :uuid, so
  # the database default stays in control.
  before_create :assign_uuid_primary_key

  private

  def assign_uuid_primary_key
    pk = self.class.primary_key
    return if pk.nil?
    return unless self.class.columns_hash[pk]&.type == :string
    return if self[pk].present?

    self[pk] = SecureRandom.uuid
  end
end
