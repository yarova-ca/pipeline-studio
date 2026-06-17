package com.example.invariants;

import com.example.entity.User;
import com.example.repository.ItemRepository;
import com.example.repository.UserRepository;
import com.example.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.actuate.observability.AutoConfigureObservability;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * YAROVA PLATFORM INVARIANT TEST SUITE — api-spring-boot golden service.
 *
 * Each test maps to one platform invariant by I-id and proves the *running*
 * Spring Boot application upholds it (full @SpringBootTest context + MockMvc).
 *
 * The JWT is minted with the same algorithm (HS256), the same secret
 * (app.jwt.secret from src/test/resources/application.properties), and the same
 * claims (sub/email/name) the running app verifies via JwtUtil. No mocking of
 * the security layer — the real AuthFilter + SecurityFilterChain run.
 *
 * Repositories are @MockBean so the context boots without PostgreSQL, exactly
 * as the existing controller tests do (H2 + mocked repos).
 *
 * Covered invariants:
 *   I-3  GET protected route, NO Authorization header        -> 401
 *   I-4  GET protected route, garbage/tampered Bearer token  -> 401
 *   I-6  POST protected route, valid token + unknown field   -> 400
 *   I-10 GET liveness probe                                  -> 200
 *   I-13 GET Prometheus scrape endpoint + golden-signal metric present
 *   I-17 response carries X-Content-Type-Options: nosniff
 */
@SpringBootTest
@AutoConfigureMockMvc
// Boot disables metrics export auto-config in tests by default. This re-enables
// the Prometheus scrape endpoint + meter registry so I-13 exercises the real path.
@AutoConfigureObservability
class PlatformInvariantsTest {

    /** Real protected route on this service (not in SecurityConfig permitAll list). */
    private static final String PROTECTED_ROUTE = "/users/me/items";

    /** Real Prometheus scrape endpoint exposed by the actuator (see application.properties). */
    private static final String METRICS_ENDPOINT = "/actuator/prometheus";

    /** Golden-signal request-duration metric emitted by Micrometer for Spring MVC. */
    private static final String GOLDEN_SIGNAL_METRIC = "http_server_requests_seconds";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JwtUtil jwtUtil;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private ItemRepository itemRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String validJwt;

    @BeforeEach
    void setUp() {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000042");
        User testUser = new User("invariant@example.com", "Invariant User", "dev");
        testUser.setId(userId);

        // Real AuthFilter path: Bearer JWT first, then X-API-Key DB lookup.
        when(userRepository.findByApiKey(any())).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(itemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Mint a token exactly how the app verifies it: same HS256 signing key,
        // same secret, same sub/email/name claims read by AuthFilter.
        validJwt = jwtUtil.generateToken(userId, "invariant@example.com", "Invariant User");
    }

    @Test
    @DisplayName("I-3: GET protected route with NO Authorization header -> 401")
    void i3_protectedRoute_noAuthHeader_returns401() throws Exception {
        mvc.perform(get(PROTECTED_ROUTE))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("I-4: GET protected route with a garbage/tampered Bearer token -> 401")
    void i4_protectedRoute_tamperedBearerToken_returns401() throws Exception {
        // Take the valid token and corrupt the signature segment so verification fails.
        String tampered = validJwt.substring(0, validJwt.length() - 3) + "AAA";

        mvc.perform(get(PROTECTED_ROUTE)
                        .header("Authorization", "Bearer " + tampered))
                .andExpect(status().isUnauthorized());

        // Also assert pure garbage (not even JWT-shaped) is rejected.
        mvc.perform(get(PROTECTED_ROUTE)
                        .header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("I-6: POST protected route with valid token + unknown JSON field -> 400")
    void i6_post_validToken_unknownField_returns400() throws Exception {
        // Unknown extra field "rogueField" alongside the legitimate "title".
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("title", "Legit title");
        body.put("rogueField", "should be rejected");

        mvc.perform(post(PROTECTED_ROUTE)
                        .header("Authorization", "Bearer " + validJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("I-10: GET liveness probe (/health/live) -> 200")
    void i10_livenessProbe_returns200() throws Exception {
        mvc.perform(get("/health/live"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("I-13: GET /actuator/prometheus -> 200 and body has http_server_requests_seconds")
    void i13_prometheusScrape_exposesRequestDurationMetric() throws Exception {
        // Generate at least one server request first so Micrometer records the
        // http_server_requests timer before we scrape it.
        mvc.perform(get("/health/live")).andExpect(status().isOk());

        mvc.perform(get(METRICS_ENDPOINT))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(GOLDEN_SIGNAL_METRIC)));
    }

    @Test
    @DisplayName("I-17: response carries security header X-Content-Type-Options: nosniff")
    void i17_response_carriesNosniffHeader() throws Exception {
        mvc.perform(get("/health/live"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }
}
