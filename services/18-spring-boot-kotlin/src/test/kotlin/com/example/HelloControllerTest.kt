package com.example

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(HelloController::class)
class HelloControllerTest {
    @Autowired lateinit var mvc: MockMvc

    @Test fun testHello() { mvc.perform(get("/")).andExpect(status().isOk).andExpect(jsonPath("$.message").exists()) }
    @Test fun testHealth() { mvc.perform(get("/health")).andExpect(status().isOk).andExpect(jsonPath("$.status").value("ok")) }
    @Test fun testLiveness() { mvc.perform(get("/health/live")).andExpect(status().isOk) }
    @Test fun testReadiness() { mvc.perform(get("/health/ready")).andExpect(status().isOk) }
}
