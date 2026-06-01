package com.example.resource;

import com.example.auth.TokenUtil;
import com.example.entity.User;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    TokenUtil tokenUtil;

    @Inject
    JsonWebToken jwt;

    @org.eclipse.microprofile.config.inject.ConfigProperty(name = "github.client.id", defaultValue = "")
    String githubClientId;

    @org.eclipse.microprofile.config.inject.ConfigProperty(name = "github.client.secret", defaultValue = "")
    String githubClientSecret;

    @org.eclipse.microprofile.config.inject.ConfigProperty(
            name = "github.redirect.uri",
            defaultValue = "http://localhost:8080/auth/callback")
    String githubRedirectUri;

    /** GET /auth/login — redirect to GitHub OAuth. */
    @GET
    @Path("/login")
    @PermitAll
    public Response login() {
        String url = "https://github.com/login/oauth/authorize"
                + "?client_id=" + URLEncoder.encode(githubClientId, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(githubRedirectUri, StandardCharsets.UTF_8)
                + "&scope=user:email";
        return Response.seeOther(URI.create(url)).build();
    }

    /** GET /auth/callback — exchange code, upsert user, return JWT. */
    @GET
    @Path("/callback")
    @PermitAll
    @Transactional
    public Response callback(@QueryParam("code") String code) {
        if (code == null || code.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Missing code")).build();
        }

        // Exchange code for GitHub access token via java.net.http.
        try {
            var form = "client_id=" + githubClientId
                    + "&client_secret=" + githubClientSecret
                    + "&code=" + code;
            var tokenReq = java.net.http.HttpRequest.newBuilder()
                    .uri(URI.create("https://github.com/login/oauth/access_token"))
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(form))
                    .build();
            var tokenRes = java.net.http.HttpClient.newHttpClient()
                    .send(tokenReq, java.net.http.HttpResponse.BodyHandlers.ofString());
            String accessToken = extractJson(tokenRes.body(), "access_token");
            if (accessToken == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "GitHub token exchange failed")).build();
            }

            // Fetch GitHub user profile.
            var profileReq = java.net.http.HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/user"))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Accept", "application/json")
                    .GET().build();
            var profileRes = java.net.http.HttpClient.newHttpClient()
                    .send(profileReq, java.net.http.HttpResponse.BodyHandlers.ofString());
            String profile = profileRes.body();

            String email = extractJson(profile, "email");
            String login = extractJson(profile, "login");
            String name = extractJson(profile, "name");
            if (email == null || email.equals("null")) email = login + "@github.noemail";
            if (name == null || name.equals("null")) name = login;

            // Upsert user.
            User user = User.findByEmail(email);
            if (user == null) {
                user = new User();
                user.email = email;
                user.name = name;
                user.provider = "github";
                user.persist();
            } else if (!user.name.equals(name)) {
                user.name = name;
            }

            String token = tokenUtil.generateToken(user.id, user.email, user.name);
            return Response.ok(Map.of("token", token)).build();
        } catch (Exception e) {
            return Response.serverError()
                    .entity(Map.of("error", "OAuth flow failed: " + e.getMessage())).build();
        }
    }

    /** GET /auth/me — return current user's profile. */
    @GET
    @Path("/me")
    @RolesAllowed("**")
    public Response me() {
        return Response.ok(Map.of(
                "id", jwt.getSubject(),
                "email", jwt.getClaim("email").toString(),
                "name", jwt.getClaim("name").toString()
        )).build();
    }

    /** POST /auth/logout — stateless JWT; no server action needed. */
    @POST
    @Path("/logout")
    @RolesAllowed("**")
    public Response logout() {
        return Response.ok(Map.of("status", "ok")).build();
    }

    /** POST /auth/api-key — generate and save API key. */
    @POST
    @Path("/api-key")
    @RolesAllowed("**")
    @Transactional
    public Response generateApiKey() {
        UUID userId = UUID.fromString(jwt.getSubject());
        User user = User.findById(userId);
        if (user == null) return Response.status(Response.Status.NOT_FOUND).build();

        String apiKey = "sk_" + UUID.randomUUID().toString().replace("-", "");
        user.apiKey = apiKey;
        return Response.ok(Map.of("apiKey", apiKey)).build();
    }

    /** DELETE /auth/api-key — revoke API key. */
    @DELETE
    @Path("/api-key")
    @RolesAllowed("**")
    @Transactional
    public Response deleteApiKey() {
        UUID userId = UUID.fromString(jwt.getSubject());
        User user = User.findById(userId);
        if (user == null) return Response.status(Response.Status.NOT_FOUND).build();
        user.apiKey = null;
        return Response.ok(Map.of("status", "ok")).build();
    }

    /** POST /dev/token — dev-only JWT without OAuth. */
    @POST
    @Path("/dev/token")
    @PermitAll
    @Transactional
    public Response devToken(
            @QueryParam("email") @DefaultValue("dev@example.com") String email,
            @QueryParam("name") @DefaultValue("Dev User") String name) {

        String env = System.getenv("QUARKUS_PROFILE");
        if ("prod".equals(env)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Not available")).build();
        }

        User user = User.findByEmail(email);
        if (user == null) {
            user = new User();
            user.email = email;
            user.name = name;
            user.provider = "dev";
            user.persist();
        }

        String token = tokenUtil.generateToken(user.id, user.email, user.name);
        return Response.ok(Map.of("token", token)).build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private String extractJson(String json, String key) {
        String pattern = "\"" + key + "\":";
        int idx = json.indexOf(pattern);
        if (idx < 0) return null;
        int start = idx + pattern.length();
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
