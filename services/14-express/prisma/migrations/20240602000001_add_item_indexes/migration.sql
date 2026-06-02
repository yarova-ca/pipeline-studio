-- AddIndex: items.user_id — speeds up "list items for user" queries
-- Without this index: O(n) table scan per user query
-- With this index: O(log n) lookup
CREATE INDEX IF NOT EXISTS "idx_items_user_id" ON "items"("user_id");

-- AddIndex: items.created_at DESC — speeds up paginated listing
CREATE INDEX IF NOT EXISTS "idx_items_created_at_desc" ON "items"("created_at" DESC);

-- AddIndex: compound (user_id, created_at DESC) — covers the most common query pattern
-- "SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
CREATE INDEX IF NOT EXISTS "idx_items_user_created" ON "items"("user_id", "created_at" DESC);
