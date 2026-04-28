package com.example.skillSwap.controller;

import com.example.skillSwap.service.SessionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc; 

    @MockBean
    private SessionService sessionService;

    @Test
    void getSession_ShouldReturnUnauthorized_WhenNoTokenProvided() throws Exception {
        // We try to call an API without a JWT token
        mockMvc.perform(get("/api/sessions/dashboard"))
               .andExpect(status().isUnauthorized()); 
    }
}