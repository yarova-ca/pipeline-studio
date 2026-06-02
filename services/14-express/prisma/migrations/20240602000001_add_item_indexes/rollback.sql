-- Rollback: drop the indexes added in migration 20240602000001
-- Run this if the migration needs to be undone manually
DROP INDEX IF EXISTS "idx_items_user_created";
DROP INDEX IF EXISTS "idx_items_created_at_desc";
DROP INDEX IF EXISTS "idx_items_user_id";
