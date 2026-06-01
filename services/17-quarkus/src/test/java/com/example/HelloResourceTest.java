package com.example;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;

@QuarkusTest
class HelloResourceTest {
    @Test void testHello() {
        given().when().get("/").then().statusCode(200).body("message", containsString("Quarkus"));
    }
    @Test void testHealth() {
        given().when().get("/health").then().statusCode(200).body("status", is("ok"));
    }
    @Test void testLiveness() { given().when().get("/health/live").then().statusCode(200); }
    @Test void testReadiness() { given().when().get("/health/ready").then().statusCode(200); }
}
