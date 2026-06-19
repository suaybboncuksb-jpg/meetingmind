package com.meetingmind.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.http.io.entity.EntityUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class MistralService {

    @Value("${mistral.api.key}")
    private String apiKey;

    private static final String MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
    private static final String MODEL = "mistral-small-latest";

    private final ObjectMapper mapper = new ObjectMapper();

    public MistralAnalysisResult analyzeTranscript(String transcript) {
        try {
            String response = callMistralAPI(transcript);
            return parseMistralResponse(response);
        } catch (Exception e) {
            System.err.println("Error analyzing transcript with Mistral: " + e.getMessage());
            return createErrorResult(e.getMessage());
        }
    }

    private String systemPrompt() {
        String today = LocalDate.now().toString();
        return """
            Du bist ein Assistent, der deutschsprachige Meeting-Transkripte analysiert.
            Heutiges Datum: %s (Wochentag heute beachten).
            Antworte AUSSCHLIESSLICH mit gültigem JSON in genau diesem Schema:
            {
              "summary": "2-3 Sätze Zusammenfassung",
              "keyPoints": ["wichtigster Punkt", "..."],
              "decisions": ["getroffene Entscheidung", "..."],
              "actionItems": [{"title": "konkrete Aufgabe", "assignee": "Name oder leer", "deadline": "YYYY-MM-DD oder leer"}],
              "nextSteps": ["nächster Schritt", "..."],
              "questions": ["offene Frage", "..."]
            }
            Wandle relative Fristangaben (z. B. "bis Freitag", "nächste Woche", "in 3 Tagen")
            ausgehend vom heutigen Datum in ein konkretes Datum im Format YYYY-MM-DD um.
            Wenn keine Frist genannt ist, setze deadline auf "".
            Verwende leere Arrays, wenn nichts zutrifft. Kein Text außerhalb des JSON.
            """.formatted(today);
    }

    private String callMistralAPI(String transcript) throws Exception {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost httpPost = new HttpPost(MISTRAL_API_URL);
            httpPost.setHeader("Authorization", "Bearer " + apiKey);
            httpPost.setHeader("Content-Type", "application/json");
            httpPost.setHeader("Accept", "application/json");

            Map<String, Object> requestBody = Map.of(
                "model", MODEL,
                "temperature", 0.2,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt()),
                    Map.of("role", "user", "content",
                        "Analysiere das folgende Meeting-Transkript:\n\n" + transcript)
                )
            );

            String jsonBody = mapper.writeValueAsString(requestBody);
            httpPost.setEntity(new StringEntity(jsonBody, StandardCharsets.UTF_8));

            return httpClient.execute(httpPost, resp -> {
                String body = resp.getEntity() != null
                    ? EntityUtils.toString(resp.getEntity(), StandardCharsets.UTF_8) : "";
                if (resp.getCode() != 200) {
                    throw new RuntimeException("Mistral API error " + resp.getCode() + ": " + body);
                }
                return body;
            });
        }
    }

    private MistralAnalysisResult parseMistralResponse(String response) throws Exception {
        JsonNode root = mapper.readTree(response);
        String content = root.path("choices").path(0).path("message").path("content").asText("");
        if (content.isBlank()) {
            return createErrorResult("Leere Antwort von Mistral");
        }

        JsonNode data = mapper.readTree(content);

        MistralAnalysisResult result = new MistralAnalysisResult(
            data.path("summary").asText(""),
            joinLines(data.path("keyPoints")),
            joinLines(data.path("decisions")),
            buildActionItems(data.path("actionItems")),
            joinLines(data.path("nextSteps")),
            joinLines(data.path("questions")),
            content
        );
        result.setActionItemList(extractActionItems(data.path("actionItems")));
        return result;
    }

    /** Action Items als strukturierte Liste (Titel, Assignee, Deadline). */
    private List<ActionItem> extractActionItems(JsonNode array) {
        List<ActionItem> items = new ArrayList<>();
        if (array == null || !array.isArray()) return items;
        for (JsonNode node : array) {
            String title;
            String assignee = "";
            String deadline = "";
            if (node.isTextual()) {
                title = node.asText();
            } else {
                title = node.path("title").asText("");
                assignee = node.path("assignee").asText("");
                deadline = node.path("deadline").asText("");
            }
            if (title == null || title.isBlank()) continue;
            items.add(new ActionItem(title.trim(), assignee.trim(), deadline.trim()));
        }
        return items;
    }

    /** String-Array (oder Objekte) -> eine Zeile pro Eintrag. */
    private String joinLines(JsonNode array) {
        if (array == null || !array.isArray()) return "";
        StringBuilder sb = new StringBuilder();
        for (JsonNode node : array) {
            String line = node.isTextual() ? node.asText() : node.path("title").asText(node.toString());
            line = line.trim();
            if (!line.isEmpty()) {
                if (sb.length() > 0) sb.append("\n");
                sb.append(line);
            }
        }
        return sb.toString();
    }

    /**
     * Action Items als Zeilen "Titel [Assignee]" – passend zur Task-Erzeugung,
     * die den Verantwortlichen aus den eckigen Klammern liest.
     */
    private String buildActionItems(JsonNode array) {
        if (array == null || !array.isArray()) return "";
        StringBuilder sb = new StringBuilder();
        for (JsonNode node : array) {
            String title;
            String assignee = "";
            String deadline = "";
            if (node.isTextual()) {
                title = node.asText();
            } else {
                title = node.path("title").asText("");
                assignee = node.path("assignee").asText("");
                deadline = node.path("deadline").asText("");
            }
            title = title.trim();
            if (title.isEmpty()) continue;
            if (sb.length() > 0) sb.append("\n");
            sb.append(title);
            if (assignee != null && !assignee.isBlank()) {
                sb.append(" [").append(assignee.trim()).append("]");
            }
            if (deadline != null && !deadline.isBlank()) {
                sb.append(" (bis ").append(deadline.trim()).append(")");
            }
        }
        return sb.toString();
    }

    private MistralAnalysisResult createErrorResult(String reason) {
        return new MistralAnalysisResult(
            "Analyse fehlgeschlagen",
            "", "", "", "", "",
            reason == null ? "" : reason
        );
    }
}
