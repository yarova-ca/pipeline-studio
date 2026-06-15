package com.example.controller;

import com.example.entity.User;
import com.example.repository.ItemRepository;
import com.example.repository.UserRepository;
import com.example.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests auth filter behaviour:
 * - 401 when no credential provided on a protected route.
 * - 200 when a valid JWT is provided.
 * - 200 when a valid API key is provided.
 * - 401 when a bad API key is provided.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JwtUtil jwtUtil;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private ItemRepository itemRepository;

    private User testUser;
    private String validJwt;
    private static final String VALID_API_KEY = "sk_testapikey123";

    @BeforeEach
    void setUp() {
        testUser = new User("test@example.com", "Test User", "dev");
        // Set ID via reflection-free approach: save triggers UUID generation.
        // For tests we assign a fixed UUID using a helper constructor path.
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000001");

        // Replicate what JPA would do — expose through the mock
        when(userRepository.findByApiKey(VALID_API_KEY)).thenReturn(Optional.of(testUser));
        when(userRepository.findByApiKey("bad-key")).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        validJwt = jwtUtil.generateToken(userId, "test@example.com", "Test User");
    }

    @Test
    void protectedRoute_noAuth_returns401() throws Exception {
        mvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedRoute_validJwt_returns200() throws Exception {
        mvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + validJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void protectedRoute_validApiKey_returns200() throws Exception {
        mvc.perform(get("/auth/me")
                        .header("X-API-Key", VALID_API_KEY))
                .andExpect(status().isOk());
    }

    @Test
    void protectedRoute_badApiKey_returns401() throws Exception {
        mvc.perform(get("/auth/me")
                        .header("X-API-Key", "bad-key"))
                .andExpect(status().isUnauthorized());
    }
}
