package com.example

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
class Application

fun main(args: Array<String>) {
    runApplication<Application>(*args)
}

@RestController
class HelloController {
    @GetMapping("/") fun hello() = mapOf("message" to "Hello from Spring Boot Kotlin 3.4", "framework" to "18-spring-boot-kotlin", "version" to "1.0.0")
    @GetMapping("/health") fun health() = mapOf("status" to "ok", "version" to "1.0.0")
    @GetMapping("/health/live") fun liveness() = mapOf("status" to "ok")
    @GetMapping("/health/ready") fun readiness() = mapOf("status" to "ok")
}
