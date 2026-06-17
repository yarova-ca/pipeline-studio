# This file is the authoritative database schema.
#
# Production runs PostgreSQL with native uuid primary keys (see db/migrate).
# The test suite runs SQLite in-memory (config/database.yml `test`), which has
# no native uuid type, so primary keys are declared here as strings. The models
# fill them with SecureRandom.uuid before create (see app/models). This keeps
# the loaded schema adapter-agnostic while preserving uuid-shaped ids in tests.

ActiveRecord::Schema[8.0].define(version: 2024_01_01_000002) do
  create_table "users", id: :string, force: :cascade do |t|
    t.string "email", null: false
    t.string "name", null: false
    t.string "api_key"
    t.string "provider", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["api_key"], name: "index_users_on_api_key", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "items", id: :string, force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.string "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_items_on_user_id"
  end

  add_foreign_key "items", "users"
end
