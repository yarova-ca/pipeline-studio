cmake_minimum_required(VERSION 3.28)
project(27-drogon VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Drogon REQUIRED)

add_executable(${PROJECT_NAME} main.cc)
target_link_libraries(${PROJECT_NAME} PRIVATE Drogon::Drogon)

enable_testing()
find_package(GTest REQUIRED)
add_executable(health_test tests/health_test.cc)
target_link_libraries(health_test PRIVATE Drogon::Drogon GTest::gtest_main)
gtest_discover_tests(health_test)
