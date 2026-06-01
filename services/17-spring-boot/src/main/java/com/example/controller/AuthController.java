package com.example.controller;

import com.example.entity.User;
import com.example.repository.UserRepository;
import com.example.security.AuthenticatedUser;
import com.example.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${github.client.id:}")
    private String githubClientId;

    @Value("${github.client.secret:}")
    private String githubClientSecret;

    @Value("${github.redirect.uri:http://localhost:8080/auth/callback}")
    private String githubRedirectUri;

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Redirect user to GitHub OAuth authorization page.
     */
    @GetMapping("/auth/login")
    public RedirectView login() {
        String url = "https://github.com/login/oauth/authorize"
                + "?client_id=" + URLEncoder.encode(githubClientId, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(githubRedirectUri, StandardCharsets.UTF_8)
                + "&scope=user:email";
        return new RedirectView(url);
    }

    /**
     * GitHub OAuth callback — exchange code, upsert user, return JWT.
     */
    @GetMapping("/auth/callback")
    public ResponseEntity<Map<String, String>> callback(@RequestParam String code) {
        // Exchange code for GitHub access token
        org.springframework.web.client.RestTemplate rt = new org.springframework.web.client.RestTemplate();
        ResponseEntity<Map> tokenResponse = rt.postForEntity(
                "https://github.com/login/oauth/access_token"
                        + "?client_id=" + githubClientId
                        + "&client_secret=" + githubClientSecret
                        + "&code=" + code,
                null, Map.class);

        if (tokenResponse.getBody() == null || !tokenResponse.getBody().containsKey("access_token")) {
            return ResponseEntity.status(401).body(Map.of("error", "GitHub token exchange failed"));
        }

        String accessToken = (String) tokenResponse.getBody().get("access_token");

        // Fetch GitHub user profile
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("Accept", "application/json");
        org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);

        ResponseEntity<Map> profileResponse = rt.exchange(
                "https://api.github.com/user",
                org.springframework.http.HttpMethod.GET,
                entity, Map.class);

        if (profileResponse.getBody() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "GitHub profile fetch failed"));
        }

        Map<String, Object> profile = profileResponse.getBody();
        String email = profile.get("email") != null
                ? (String) profile.get("email")
                : profile.get("login") + "@github.noemail";
        String name = profile.get("name") != null
                ? (String) profile.get("name")
                : (String) profile.get("login");

        // Upsert user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User(email, name, "github");
            return userRepository.save(u);
        });
        if (!user.getName().equals(name)) {
            user.setName(name);
            user = userRepository.save(user);
        }

        String jwt = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getName());
        return ResponseEntity.ok(Map.of("token", jwt));
    }

    /**
     * Return the currently authenticated user's profile.
     */
    @GetMapping("/auth/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of(
                "id", principal.getId().toString(),
                "email", principal.getEmail(),
                "name", principal.getName()
        ));
    }

    /**
     * Logout — stateless JWT means no server-side action needed.
     */
    @PostMapping("/auth/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    /**
     * Generate and save an API key for the current user.
     */
    @PostMapping("/auth/api-key")
    public ResponseEntity<Map<String, String>> generateApiKey(Authentication authentication) {
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String apiKey = "sk_" + UUID.randomUUID().toString().replace("-", "");
        user.setApiKey(apiKey);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("apiKey", apiKey));
    }

    /**
     * Revoke the current user's API key.
     */
    @DeleteMapping("/auth/api-key")
    public ResponseEntity<Void> deleteApiKey(Authentication authentication) {
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setApiKey(null);
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }

    /**
     * Dev-only endpoint: generate a JWT for a test user without OAuth.
     * Only available when spring profile "dev" is active.
     */
    @Profile("dev")
    @PostMapping("/dev/token")
    public ResponseEntity<Map<String, String>> devToken(
            @RequestParam(defaultValue = "dev@example.com") String email,
            @RequestParam(defaultValue = "Dev User") String name) {

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User(email, name, "dev");
            return userRepository.save(u);
        });

        String jwt = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getName());
        return ResponseEntity.ok(Map.of("token", jwt));
    }
}
