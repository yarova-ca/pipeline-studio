package com.example;

import io.micronaut.http.HttpStatus;
import io.micronaut.http.client.HttpClient;
import io.micronaut.http.client.annotation.Client;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

@MicronautTest
class HelloControllerTest {
    @Inject @Client("/") HttpClient client;

    @Test void testHello() { assertEquals(HttpStatus.OK, client.toBlocking().exchange("/").status()); }
    @Test void testHealth() { assertEquals(HttpStatus.OK, client.toBlocking().exchange("/health").status()); }
    @Test void testLiveness() { assertEquals(HttpStatus.OK, client.toBlocking().exchange("/health/live").status()); }
    @Test void testReadiness() { assertEquals(HttpStatus.OK, client.toBlocking().exchange("/health/ready").status()); }
}
