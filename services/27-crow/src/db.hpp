#pragma once
#include <string>
#include <vector>
#include <optional>

// User — row in the users table.
struct User {
    int         id;
    std::string email;
    std::string name;
    std::string password_hash;
};

// Item — row in the items table, owned by a User.
struct Item {
    int         id;
    std::string title;
    int         user_id;
};

// DB — thin wrapper around libpqxx for PostgreSQL.
// Connection string read from DATABASE_URL env var.
class DB {
public:
    DB();

    // run_migrations — creates tables if they don't exist. Called once at startup.
    void run_migrations();

    // find_user_by_email — returns the user row or nullopt.
    std::optional<User> find_user_by_email(const std::string& email);

    // create_user — inserts a new user, returns the created row.
    User create_user(const std::string& email,
                     const std::string& name,
                     const std::string& password_hash);

    // get_items_for_user — returns all items owned by user_id.
    std::vector<Item> get_items_for_user(int user_id);

    // create_item — inserts a new item, returns the created row.
    Item create_item(const std::string& title, int user_id);

    // delete_item — deletes item owned by user_id. Returns rows affected.
    int delete_item(int item_id, int user_id);

private:
    std::string conn_str_;
};
