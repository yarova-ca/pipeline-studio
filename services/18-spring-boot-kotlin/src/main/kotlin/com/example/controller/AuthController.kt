package com.example.controller

import com.example.auth.AuthenticatedUser
import com.example.auth.JwtUtil
import com.example.entity.User
import com.example.repository.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import org.springframework.web.client.RestTemplate
import org.springframework.web.servlet.view.RedirectView
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.UUID

@RestController
class AuthController(
    private val userRepository: UserRepository,
    private val jwtUtil: JwtUtil,
) {

    @Value("\${github.client.id:}")
    private lateinit var githubClientId: String

    @Value("\${github.client.secret:}")
    private lateinit var githubClientSecret: String

    @Value("\${github.redirect.uri:http://localhost:8080/auth/callback}")
    private lateinit var githubRedirectUri: String

    /** GET /auth/login — redirect to GitHub OAuth. */
    @GetMapping("/auth/login")
    fun login(): RedirectView {
        val url = "https://github.com/login/oauth/authorize" +
            "?client_id=${URLEncoder.encode(githubClientId, StandardCharsets.UTF_8)}" +
            "&redirect_uri=${URLEncoder.encode(githubRedirectUri, StandardCharsets.UTF_8)}" +
            "&scope=user:email"
        return RedirectView(url)
    }

    /** GET /auth/callback — exchange code, upsert user, return JWT. */
    @GetMapping("/auth/callback")
    fun callback(@RequestParam code: String): ResponseEntity<Map<String, String>> {
        val rt = RestTemplate()

        @Suppress("UNCHECKED_CAST")
        val tokenResponse = rt.postForEntity(
            "https://github.com/login/oauth/access_token" +
                "?client_id=$githubClientId&client_secret=$githubClientSecret&code=$code",
            null, Map::class.java,
        )

        val accessToken = tokenResponse.body?.get("access_token") as? String
            ?: return ResponseEntity.status(401).body(mapOf("error" to "GitHub token exchange failed"))

        val headers = org.springframework.http.HttpHeaders().apply {
            set("Authorization", "Bearer $accessToken")
            set("Accept", "application/json")
        }
        val entity = org.springframework.http.HttpEntity<Void>(headers)

        @Suppress("UNCHECKED_CAST")
        val profileResponse = rt.exchange(
            "https://api.github.com/user",
            org.springframework.http.HttpMethod.GET,
            entity, Map::class.java,
        )

        val profile = profileResponse.body
            ?: return ResponseEntity.status(401).body(mapOf("error" to "GitHub profile fetch failed"))

        val email = (profile["email"] as? String)
            ?: "${profile["login"]}@github.noemail"
        val name = (profile["name"] as? String) ?: (profile["login"] as? String) ?: email

        var user = userRepository.findByEmail(email) ?: run {
            userRepository.save(User(email = email, name = name, provider = "github"))
        }
        if (user.name != name) {
            user = userRepository.save(user.copy(name = name))
        }

        val jwt = jwtUtil.generateToken(user.id, user.email, user.name)
        return ResponseEntity.ok(mapOf("token" to jwt))
    }

    /** GET /auth/me — return current authenticated user. */
    @GetMapping("/auth/me")
    fun me(authentication: Authentication): ResponseEntity<Map<String, String>> {
        val principal = authentication.principal as AuthenticatedUser
        return ResponseEntity.ok(
            mapOf("id" to principal.id.toString(), "email" to principal.email, "name" to principal.name),
        )
    }

    /** POST /auth/logout — stateless JWT; no server action needed. */
    @PostMapping("/auth/logout")
    fun logout(): ResponseEntity<Map<String, String>> =
        ResponseEntity.ok(mapOf("status" to "ok"))

    /** POST /auth/api-key — generate and save an API key. */
    @PostMapping("/auth/api-key")
    fun generateApiKey(authentication: Authentication): ResponseEntity<Map<String, String>> {
        val principal = authentication.principal as AuthenticatedUser
        val user = userRepository.findById(principal.id).orElseThrow()
        val apiKey = "sk_" + UUID.randomUUID().toString().replace("-", "")
        userRepository.save(user.copy(apiKey = apiKey))
        return ResponseEntity.ok(mapOf("apiKey" to apiKey))
    }

    /** DELETE /auth/api-key — revoke the API key. */
    @DeleteMapping("/auth/api-key")
    fun deleteApiKey(authentication: Authentication): ResponseEntity<Void> {
        val principal = authentication.principal as AuthenticatedUser
        val user = userRepository.findById(principal.id).orElseThrow()
        userRepository.save(user.copy(apiKey = null))
        return ResponseEntity.ok().build()
    }

    /** POST /dev/token — dev profile only; generates JWT without OAuth. */
    @Profile("dev")
    @PostMapping("/dev/token")
    fun devToken(
        @RequestParam(defaultValue = "dev@example.com") email: String,
        @RequestParam(defaultValue = "Dev User") name: String,
    ): ResponseEntity<Map<String, String>> {
        val user = userRepository.findByEmail(email)
            ?: userRepository.save(User(email = email, name = name, provider = "dev"))
        val jwt = jwtUtil.generateToken(user.id, user.email, user.name)
        return ResponseEntity.ok(mapOf("token" to jwt))
    }

}
