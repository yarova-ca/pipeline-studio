cmake_minimum_required(VERSION 3.28)
project(27-drogon VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Debian's Drogon 1.8.x ships FindJsoncpp.cmake using the removed exec_program
# command. CMake 3.28 rejects it under policy CMP0153. Allow the old behavior.
if(POLICY CMP0153)
    cmake_policy(SET CMP0153 OLD)
endif()
find_package(Drogon REQUIRED)

# jwt-cpp: header-only JWT library (requires OpenSSL)
include(FetchContent)
FetchContent_Declare(jwt-cpp
    GIT_REPOSITORY https://github.com/Thalhammer/jwt-cpp.git
    GIT_TAG v0.7.0
)
FetchContent_MakeAvailable(jwt-cpp)

# libpqxx: PostgreSQL C++ client
# Ubuntu's libpqxx-dev (7.x) ships pkg-config only, no CMake package config.
# Use pkg-config to locate it instead of find_package(libpqxx).
find_package(PkgConfig REQUIRED)
pkg_check_modules(PQXX REQUIRED IMPORTED_TARGET libpqxx)
find_package(OpenSSL REQUIRED)

add_executable(${PROJECT_NAME}
    main.cc
    src/auth.cpp
    src/db.cpp
)
target_include_directories(${PROJECT_NAME} PRIVATE src)
target_link_libraries(${PROJECT_NAME} PRIVATE
    Drogon::Drogon
    jwt-cpp::jwt-cpp
    PkgConfig::PQXX
    OpenSSL::SSL
    OpenSSL::Crypto
)

# prometheus-cpp for metrics
# find_package(prometheus-cpp CONFIG REQUIRED)
# target_link_libraries(${PROJECT_NAME} prometheus-cpp::pull)

enable_testing()
find_package(GTest REQUIRED)
add_executable(health_test tests/health_test.cc)
target_link_libraries(health_test PRIVATE Drogon::Drogon GTest::gtest_main)
gtest_discover_tests(health_test)
