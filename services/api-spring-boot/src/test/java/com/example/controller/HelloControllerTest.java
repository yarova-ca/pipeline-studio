package com.example.controller;

import com.example.repository.ItemRepository;
import com.example.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class HelloControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private ItemRepository itemRepository;

    @Test
    void testHello() throws Exception {
        mvc.perform(get("/")).andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void testHealth() throws Exception {
        mvc.perform(get("/health")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void testLiveness() throws Exception {
        mvc.perform(get("/health/live")).andExpect(status().isOk());
    }

    @Test
    void testReadiness() throws Exception {
        mvc.perform(get("/health/ready")).andExpect(status().isOk());
    }
}
