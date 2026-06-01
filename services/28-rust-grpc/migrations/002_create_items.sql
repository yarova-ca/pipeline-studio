-- Migration 002: create items table with FK to users
CREATE TABLE IF NOT EXISTS items (
    id          TEXT        NOT NULL PRIMARY KEY,
    title       TEXT        NOT NULL,
    description TEXT,
    user_id     TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_user_id ON items (user_id);
