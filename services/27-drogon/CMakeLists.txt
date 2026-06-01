cmake_minimum_required(VERSION 3.28)
project(27-drogon VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Drogon REQUIRED)

# jwt-cpp: header-only JWT library (requires OpenSSL)
include(FetchContent)
FetchContent_Declare(jwt-cpp
    GIT_REPOSITORY https://github.com/Thalhammer/jwt-cpp.git
    GIT_TAG v0.7.0
)
FetchContent_MakeAvailable(jwt-cpp)

# libpqxx: PostgreSQL C++ client
find_package(libpqxx REQUIRED)
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
    libpqxx::pqxx
    OpenSSL::SSL
    OpenSSL::Crypto
)

enable_testing()
find_package(GTest REQUIRED)
add_executable(health_test tests/health_test.cc)
target_link_libraries(health_test PRIVATE Drogon::Drogon GTest::gtest_main)
gtest_discover_tests(health_test)
