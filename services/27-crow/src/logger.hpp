#pragma once
#include <iostream>
#include <string>
#include <chrono>
#include <sstream>
#include <iomanip>
#include <ctime>

// Structured JSON logger for C++ services.
// spdlog would be ideal but uses header-only pattern here for simplicity.
inline void log_json(const std::string& level, const std::string& msg) {
    auto now = std::chrono::system_clock::now();
    auto t = std::chrono::system_clock::to_time_t(now);
    std::ostringstream oss;
    oss << std::put_time(std::gmtime(&t), "%Y-%m-%dT%H:%M:%SZ");
    std::cout << "{\"level\":\"" << level
              << "\",\"timestamp\":\"" << oss.str()
              << "\",\"message\":\"" << msg << "\"}\n";
}

#define LOG_INFO(msg) log_json("info", msg)
#define LOG_ERROR(msg) log_json("error", msg)
#define LOG_WARN(msg) log_json("warn", msg)
