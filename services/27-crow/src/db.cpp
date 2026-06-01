#include "db.hpp"
#include <pqxx/pqxx>
#include <cstdlib>
#include <stdexcept>

DB::DB() {
    const char* url = std::getenv("DATABASE_URL");
    conn_str_ = url ? std::string(url) : "postgresql://postgres@localhost/dev";
}

void DB::run_migrations() {
    pqxx::connection c(conn_str_);
    pqxx::work txn(c);
    txn.exec(R"(
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL
        )
    )");
    txn.exec(R"(
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
        )
    )");
    txn.commit();
}

std::optional<User> DB::find_user_by_email(const std::string& email) {
    pqxx::connection c(conn_str_);
    pqxx::work txn(c);
    auto r = txn.exec_params(
        "SELECT id, email, name, password_hash FROM users WHERE email = $1", email);
    if (r.empty()) return std::nullopt;
    return User{r[0][0].as<int>(), r[0][1].as<std::string>(),
                r[0][2].as<std::string>(), r[0][3].as<std::string>()};
}

User DB::create_user(
    const std::string& email,
    const std::string& name,
    const std::string& password_hash)
{
    pqxx::connection c(conn_str_);
    pqxx::work txn(c);
    auto r = txn.exec_params(
        "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) "
        "RETURNING id, email, name, password_hash",
        email, name, password_hash);
    txn.commit();
    return User{r[0][0].as<int>(), r[0][1].as<std::string>(),
                r[0][2].as<std::string>(), r[0][3].as<std::string>()};
}

std::vector<Item> DB::get_items_for_user(int user_id) {
    pqxx::connection c(conn_str_);
    pqxx::work txn(c);
    auto r = txn.exec_params(
        "SELECT id, title, user_id FROM items WHERE user_id = $1", user_id);
    std::vector<Item> items;
    for (const auto& row : r) {
        items.push_back({row[0].as<int>(), row[1].as<std::string>(), row[2].as<int>()});
    }
    return items;
}

Item DB::create_item(const std::string& title, int user_id) {
    pqxx::connection c(conn_str_);
    pqxx::work txn(c);
    auto r = txn.exec_params(
        "INSERT INTO items (title, user_id) VALUES ($1, $2) RETURNING id, title, user_id",
        title, user_id);
    txn.commit();
    return Item{r[0][0].as<int>(), r[0][1].as<std::string>(), r[0][2].as<int>()};
}

int DB::delete_item(int item_id, int user_id) {
    pqxx::connection c(conn_str_);
    pqxx::work txn(c);
    auto r = txn.exec_params(
        "DELETE FROM items WHERE id = $1 AND user_id = $2", item_id, user_id);
    txn.commit();
    return r.affected_rows();
}
