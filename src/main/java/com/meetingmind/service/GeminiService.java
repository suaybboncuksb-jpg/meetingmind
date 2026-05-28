package com.meetingmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetingmind.dto.AiAnalysisResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GeminiService {

    @Value("${groq.api.key}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GROQ_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    public AiAnalysisResponse analyzeMeetingProtocol(String protocolText) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            String prompt = """
                Du bist ein professioneller Meeting-Assistent.
                Analysiere das folgende Meeting-Protokoll und antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt.
                Kein erklärender Text, keine Markdown-Formatierung, keine Codeblöcke - NUR das JSON.
                
                Verwende exakt diese JSON-Struktur:
                {
                  "summary": "Kurze professionelle Zusammenfassung des Meetings in maximal 4 Sätzen",
                  "todos": [
                    {
                      "task": "Konkrete Aufgabe",
                      "owner": "Verantwortliche Person oder nicht genannt",
                      "deadline": "Deadline oder nicht genannt",
                      "priority": "niedrig | mittel | hoch"
                    }
                  ],
                  "decisions": ["Getroffene Entscheidung 1", "Getroffene Entscheidung 2"],
                  "openQuestions": ["Offene Frage 1", "Offene Frage 2"],
                  "risks": ["Risiko oder Blocker 1", "Risiko oder Blocker 2"],
                  "nextSteps": ["Naechster Schritt 1", "Naechster Schritt 2"]
                }
                
                Regeln:
                - Wenn keine Todos vorhanden sind, gib eine leere Liste zurueck: []
                - Wenn keine Entscheidungen getroffen wurden, gib [] zurueck
                - Wenn keine offenen Fragen vorhanden sind, gib [] zurueck
                - Antworte NUR mit dem JSON, sonst nichts
                
                Meeting-Protokoll:
                """ + protocolText;

            Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.3-70b-versatile",
                    "messages", List.of(
                            Map.of(
                                    "role", "user",
                                    "content", prompt
                            )
                    ),
                    "temperature", 0.3
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    GROQ_URL, request, String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String text = root
                    .path("choices").get(0)
                    .path("message")
                    .path("content").asText();

            String cleanJson = text
                    .replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            return objectMapper.readValue(cleanJson, AiAnalysisResponse.class);

        } catch (Exception e) {
            throw new RuntimeException("Groq API Fehler: " + e.getMessage());
        }
    }
}