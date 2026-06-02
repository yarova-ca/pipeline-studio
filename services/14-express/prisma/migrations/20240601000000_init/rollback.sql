-- Rollback: drop all tables created in migration 20240601000000_init
-- Run this if you need to fully reset the schema
-- WARNING: this deletes ALL data
DROP TABLE IF EXISTS "items" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
