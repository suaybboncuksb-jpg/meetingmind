package com.meetingmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=";

    public String analyzeMeetingProtocol(String protocolText) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            String prompt = """
                Analysiere dieses Meeting-Protokoll und antworte NUR mit einem JSON-Objekt in diesem Format:
                {
                  "summary": "Kurze Zusammenfassung des Meetings in 2-3 Sätzen",
                  "tasks": [
                    {"description": "Aufgabenbeschreibung", "assignedTo": "Name", "dueDate": "Datum oder null"},
                    {"description": "Aufgabenbeschreibung", "assignedTo": "Name", "dueDate": "Datum oder null"}
                  ]
                }
                
                Protokoll:
                """ + protocolText;

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)
                            ))
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_URL + apiKey, request, String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String text = root
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text").asText();

            return text.replaceAll("```json", "").replaceAll("```", "").trim();

        } catch (Exception e) {
            throw new RuntimeException("Gemini API Fehler: " + e.getMessage());
        }
    }
}

