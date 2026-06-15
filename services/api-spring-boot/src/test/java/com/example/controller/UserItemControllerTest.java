package com.example.controller;

import com.example.entity.Item;
import com.example.entity.User;
import com.example.repository.ItemRepository;
import com.example.repository.UserRepository;
import com.example.security.JwtUtil;
import com.example.service.ItemService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * CRUD tests for /users/me/items.
 * All requests use a valid JWT. Repositories are mocked with @MockBean.
 */
@SpringBootTest
@AutoConfigureMockMvc
class UserItemControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JwtUtil jwtUtil;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private ItemRepository itemRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String jwt;
    private UUID userId;
    private User testUser;
    private Item testItem;
    private UUID itemId;

    @BeforeEach
    void setUp() {
        userId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        itemId = UUID.fromString("00000000-0000-0000-0000-000000000099");

        testUser = new User("items@example.com", "Items User", "dev");

        testItem = new Item("Test Title", "Test description", testUser);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.findByApiKey(any())).thenReturn(Optional.empty());
        when(itemRepository.findByUser_Id(userId)).thenReturn(List.of(testItem));
        when(itemRepository.findByIdAndUser_Id(eq(itemId), eq(userId))).thenReturn(Optional.of(testItem));
        when(itemRepository.save(any(Item.class))).thenAnswer(inv -> inv.getArgument(0));

        jwt = jwtUtil.generateToken(userId, "items@example.com", "Items User");
    }

    @Test
    void listItems_returnsOk() throws Exception {
        mvc.perform(get("/users/me/items")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Test Title"));
    }

    @Test
    void createItem_validBody_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("title", "New Item", "description", "desc"));

        mvc.perform(post("/users/me/items")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

    @Test
    void createItem_missingTitle_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("description", "no title"));

        mvc.perform(post("/users/me/items")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getItem_existingId_returnsOk() throws Exception {
        mvc.perform(get("/users/me/items/" + itemId)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Title"));
    }

    @Test
    void getItem_notOwned_returns404() throws Exception {
        UUID otherId = UUID.randomUUID();
        when(itemRepository.findByIdAndUser_Id(eq(otherId), eq(userId))).thenReturn(Optional.empty());

        mvc.perform(get("/users/me/items/" + otherId)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateItem_returnsOk() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("title", "Updated", "description", "updated desc"));

        mvc.perform(put("/users/me/items/" + itemId)
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    @Test
    void deleteItem_returns204() throws Exception {
        mvc.perform(delete("/users/me/items/" + itemId)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isNoContent());
    }
}
