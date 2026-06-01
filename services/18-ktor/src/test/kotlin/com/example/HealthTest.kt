package com.example

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.*

class HealthTest {
    @Test fun testHello() = testApplication {
        application { module() }
        val r = client.get("/")
        assertEquals(HttpStatusCode.OK, r.status)
        assertTrue(r.bodyAsText().contains("Ktor"))
    }

    @Test fun testHealth() = testApplication {
        application { module() }
        val r = client.get("/health")
        assertEquals(HttpStatusCode.OK, r.status)
        assertTrue(r.bodyAsText().contains("ok"))
    }

    @Test fun testLiveness() = testApplication {
        application { module() }
        assertEquals(HttpStatusCode.OK, client.get("/health/live").status)
    }

    @Test fun testReadiness() = testApplication {
        application { module() }
        assertEquals(HttpStatusCode.OK, client.get("/health/ready").status)
    }
}
