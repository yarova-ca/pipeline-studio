package com.example.controller;

import com.example.auth.JwtAuthenticator;
import com.example.entity.User;
import com.example.repository.UserRepository;
import io.micronaut.context.annotation.Value;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import io.micronaut.security.annotation.Secured;
import io.micronaut.security.authentication.Authentication;
import io.micronaut.security.rules.SecurityRule;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Controller
public class AuthController {

    private final UserRepository userRepository;
    private final JwtAuthenticator jwtAuthenticator;

    @Value("${github.client.id:}")
    private String githubClientId;

    @Value("${github.client.secret:}")
    private String githubClientSecret;

    @Value("${github.redirect.uri:http://localhost:8080/auth/callback}")
    private String githubRedirectUri;

    public AuthController(UserRepository userRepository, JwtAuthenticator jwtAuthenticator) {
        this.userRepository = userRepository;
        this.jwtAuthenticator = jwtAuthenticator;
    }

    /** GET /auth/login — redirect to GitHub OAuth. */
    @Get("/auth/login")
    @Secured(SecurityRule.IS_ANONYMOUS)
    public HttpResponse<?> login() {
        String url = "https://github.com/login/oauth/authorize"
                + "?client_id=" + URLEncoder.encode(githubClientId, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(githubRedirectUri, StandardCharsets.UTF_8)
                + "&scope=user:email";
        return HttpResponse.redirect(URI.create(url));
    }

    /** GET /auth/callback — exchange code, upsert user, return JWT. */
    @Get("/auth/callback")
    @Secured(SecurityRule.IS_ANONYMOUS)
    public HttpResponse<Map<String, String>> callback(@QueryValue String code) {
        // Exchange code for GitHub access token.
        // Simplified: use java.net.http — Micronaut HTTP client also available.
        try {
            var form = "client_id=" + githubClientId
                    + "&client_secret=" + githubClientSecret
                    + "&code=" + code;
            var tokenReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://github.com/login/oauth/access_token"))
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();
            var tokenRes = HttpClient.newHttpClient().send(tokenReq,
                    java.net.http.HttpResponse.BodyHandlers.ofString());
            // Parse access_token from JSON response.
            String body = tokenRes.body();
            String accessToken = extractJson(body, "access_token");
            if (accessToken == null) {
                return HttpResponse.unauthorized();
            }

            // Fetch GitHub user.
            var profileReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/user"))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Accept", "application/json")
                    .GET().build();
            var profileRes = HttpClient.newHttpClient().send(profileReq,
                    java.net.http.HttpResponse.BodyHandlers.ofString());
            String profile = profileRes.body();

            String email = extractJson(profile, "email");
            String login = extractJson(profile, "login");
            String name = extractJson(profile, "name");
            if (email == null || email.equals("null")) {
                email = login + "@github.noemail";
            }
            if (name == null || name.equals("null")) name = login;

            final String finalEmail = email;
            final String finalName = name;

            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User u = new User(finalEmail, finalName, "github");
                return userRepository.save(u);
            });
            if (!user.getName().equals(finalName)) {
                user.setName(finalName);
                user = userRepository.update(user);
            }

            String jwt = jwtAuthenticator.generateToken(user.getId(), user.getEmail(), user.getName());
            return HttpResponse.ok(Map.of("token", jwt));
        } catch (Exception e) {
            return HttpResponse.serverError(Map.of("error", "OAuth flow failed"));
        }
    }

    /** GET /auth/me — return current user profile. */
    @Get("/auth/me")
    @Secured(SecurityRule.IS_AUTHENTICATED)
    public HttpResponse<Map<String, Object>> me(Authentication authentication) {
        String userId = (String) authentication.getAttributes().get("sub");
        String email = (String) authentication.getAttributes().get("email");
        String name = (String) authentication.getAttributes().get("name");
        return HttpResponse.ok(Map.of("id", userId, "email", email, "name", name));
    }

    /** POST /auth/logout — stateless JWT; no server-side action needed. */
    @Post("/auth/logout")
    @Secured(SecurityRule.IS_AUTHENTICATED)
    public HttpResponse<Map<String, String>> logout() {
        return HttpResponse.ok(Map.of("status", "ok"));
    }

    /** POST /auth/api-key — generate and save an API key. */
    @Post("/auth/api-key")
    @Secured(SecurityRule.IS_AUTHENTICATED)
    public HttpResponse<Map<String, String>> generateApiKey(Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getAttributes().get("sub"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String apiKey = "sk_" + UUID.randomUUID().toString().replace("-", "");
        user.setApiKey(apiKey);
        userRepository.update(user);
        return HttpResponse.ok(Map.of("apiKey", apiKey));
    }

    /** DELETE /auth/api-key — revoke the current user's API key. */
    @Delete("/auth/api-key")
    @Secured(SecurityRule.IS_AUTHENTICATED)
    public HttpResponse<Void> deleteApiKey(Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getAttributes().get("sub"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setApiKey(null);
        userRepository.update(user);
        return HttpResponse.ok();
    }

    /** POST /dev/token — dev-only; generates JWT without OAuth. */
    @Post("/dev/token")
    @Secured(SecurityRule.IS_ANONYMOUS)
    public HttpResponse<Map<String, String>> devToken(
            @QueryValue(defaultValue = "dev@example.com") String email,
            @QueryValue(defaultValue = "Dev User") String name) {

        String env = System.getenv("MICRONAUT_ENV");
        if ("production".equals(env)) {
            return HttpResponse.notFound();
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User(email, name, "dev");
            return userRepository.save(u);
        });

        String jwt = jwtAuthenticator.generateToken(user.getId(), user.getEmail(), user.getName());
        return HttpResponse.ok(Map.of("token", jwt));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /** Minimal JSON field extractor — avoids pulling in a full JSON library. */
    private String extractJson(String json, String key) {
        String pattern = "\"" + key + "\":";
        int idx = json.indexOf(pattern);
        if (idx < 0) return null;
        int start = idx + pattern.length();
        // Skip whitespace.
        while (start < json.length() && json.charAt(start) == ' ') start++;
        if (start >= json.length()) return null;
        if (json.charAt(start) == '"') {
            int end = json.indexOf('"', start + 1);
            return end < 0 ? null : json.substring(start + 1, end);
        }
        if (json.startsWith("null", start)) return null;
        int end = start;
        while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
        return json.substring(start, end).trim();
    }
}
