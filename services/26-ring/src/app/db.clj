(ns app.db
  (:require [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]
            [honey.sql :as hsql]))

;; db-spec — PostgreSQL connection config from env vars.
;; DATABASE_URL: full JDBC URL, e.g. jdbc:postgresql://localhost/mydb
(def db-spec
  {:jdbcUrl (or (System/getenv "DATABASE_URL")
                "jdbc:postgresql://localhost/dev")
   :username (or (System/getenv "DB_USER") "postgres")
   :password (or (System/getenv "DB_PASSWORD") "")})

(def ds (delay (jdbc/get-datasource db-spec)))

;; run-migrations — creates tables if they don't exist.
;; Called once at startup.
(defn run-migrations! []
  (jdbc/execute! @ds ["CREATE TABLE IF NOT EXISTS users (
                         id SERIAL PRIMARY KEY,
                         email TEXT NOT NULL UNIQUE,
                         name TEXT NOT NULL,
                         password_hash TEXT NOT NULL
                       )"])
  (jdbc/execute! @ds ["CREATE TABLE IF NOT EXISTS items (
                         id SERIAL PRIMARY KEY,
                         title TEXT NOT NULL,
                         user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
                       )"]))

;; find-user-by-email — returns the user row or nil.
(defn find-user-by-email [email]
  (first (jdbc/execute! @ds ["SELECT * FROM users WHERE email = ?" email])))

;; create-user! — inserts a new user row, returns the created row.
(defn create-user! [email name password-hash]
  (first (sql/insert! @ds :users {:email email :name name :password_hash password-hash})))

;; get-items-for-user — returns all items owned by user-id.
(defn get-items-for-user [user-id]
  (jdbc/execute! @ds ["SELECT * FROM items WHERE user_id = ?" user-id]))

;; create-item! — inserts a new item, returns the created row.
(defn create-item! [title user-id]
  (first (sql/insert! @ds :items {:title title :user_id user-id})))

;; delete-item! — deletes an item owned by user-id. Returns rows affected.
(defn delete-item! [item-id user-id]
  (jdbc/execute-one! @ds ["DELETE FROM items WHERE id = ? AND user_id = ?" item-id user-id]))
