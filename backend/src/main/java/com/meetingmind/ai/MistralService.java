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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MistralService {

    @Value("${mistral.api.key}")
    private String apiKey;

    private static final String MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
    private static final String MODEL = "mistral-small-latest";

    private final ObjectMapper mapper = new ObjectMapper();

    public MistralAnalysisResult analyzeTranscript(String transcript) {
        if (apiKey == null || apiKey.isBlank()) {
            return createErrorResult("Mistral API-Key fehlt. Bitte MISTRAL_API_KEY setzen.");
        }

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
            Du bist ein präziser Assistent für deutschsprachige Meeting-Analyse.
            Heutiges Datum: %s.

            Deine Aufgabe:
            Extrahiere nur echte, umsetzbare Arbeitsergebnisse aus dem Meeting.

            Antworte AUSSCHLIESSLICH mit gültigem JSON in genau diesem Schema:
            {
              "summary": "2-3 Sätze Zusammenfassung",
              "keyPoints": ["wichtiger Punkt", "..."],
              "decisions": ["konkrete Entscheidung", "..."],
              "actionItems": [
                {
                  "title": "konkrete Aufgabe mit Ergebnis",
                  "assignee": "Name der verantwortlichen Person oder leer",
                  "deadline": "YYYY-MM-DD oder leer",
                  "priority": "LOW | MEDIUM | HIGH"
                }
              ],
              "nextSteps": ["nächster Schritt", "..."],
              "questions": ["offene Frage", "..."]
            }

            Regeln für actionItems:
            - Nur echte To-dos aufnehmen, keine allgemeinen Stichpunkte.
            - Jede Aufgabe muss als konkretes Ergebnis formuliert sein.
            - Schlechte Titel wie "Prüfen", "Klären", "Besprechen", "Todo", "Test" vermeiden.
            - Besser: "Angebotszahlen prüfen", "Technische Fragen mit Kunden klären".
            - Wenn eine Person sagt "ich übernehme...", dann ist diese Person assignee.
            - Wenn ein Sprecher klar eine Aufgabe übernimmt, nutze den Sprechernamen als assignee.
            - Relative Fristen wie "bis Freitag", "nächste Woche", "in 3 Tagen" ausgehend vom heutigen Datum in YYYY-MM-DD umwandeln.
            - Wenn keine Frist genannt ist, deadline auf "" setzen.
            - HIGH bei dringenden, kundenkritischen, blockierenden oder kurzfristigen Aufgaben.
            - MEDIUM bei normalen Aufgaben.
            - LOW bei optionalen oder weniger dringenden Aufgaben.
            - Keine Duplikate erzeugen.
            - Verwende leere Arrays, wenn nichts zutrifft.
            - Kein Text außerhalb des JSON.
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
                "temperature", 0.15,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt()),
                    Map.of("role", "user", "content",
                        "Analysiere das folgende Meeting-Transkript und extrahiere präzise Aufgaben:\n\n" + transcript)
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
        List<ActionItem> actionItems = extractActionItems(data.path("actionItems"));

        MistralAnalysisResult result = new MistralAnalysisResult(
            data.path("summary").asText(""),
            joinLines(data.path("keyPoints")),
            joinLines(data.path("decisions")),
            buildActionItems(actionItems),
            joinLines(data.path("nextSteps")),
            joinLines(data.path("questions")),
            content
        );

        result.setActionItemList(actionItems);
        return result;
    }

    /** Action Items als strukturierte Liste mit Validierung und Duplikatfilter. */
    private List<ActionItem> extractActionItems(JsonNode array) {
        List<ActionItem> items = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();

        if (array == null || !array.isArray()) {
            return items;
        }

        for (JsonNode node : array) {
            String title;
            String assignee = "";
            String deadline = "";
            String priority = "MEDIUM";

            if (node.isTextual()) {
                title = node.asText("");
            } else {
                title = node.path("title").asText("");
                assignee = node.path("assignee").asText("");
                deadline = node.path("deadline").asText("");
                priority = node.path("priority").asText("MEDIUM");
            }

            ActionItem item = normalizeActionItem(title, assignee, deadline, priority);

            if (item == null) {
                continue;
            }

            String key = (
                item.title() + "|" +
                item.assignee() + "|" +
                item.deadline()
            ).toLowerCase();

            if (seen.add(key)) {
                items.add(item);
            }
        }

        return items;
    }

    private ActionItem normalizeActionItem(String title, String assignee, String deadline, String priority) {
        String cleanTitle = cleanText(title)
            .replaceAll("^[\\-•*]+\\s*", "")
            .replaceAll("\\.$", "")
            .trim();

        if (!isUsefulActionTitle(cleanTitle)) {
            return null;
        }

        String cleanAssignee = normalizeAssignee(assignee);
        String cleanDeadline = normalizeDeadline(deadline);
        String cleanPriority = normalizePriority(priority);

        return new ActionItem(cleanTitle, cleanAssignee, cleanDeadline, cleanPriority);
    }

    private boolean isUsefulActionTitle(String title) {
        String normalized = cleanText(title).toLowerCase();

        if (normalized.isBlank()) return false;
        if (normalized.length() < 8) return false;
        if (normalized.startsWith("test")) return false;

        Set<String> generic = Set.of(
            "todo",
            "aufgabe",
            "machen",
            "prüfen",
            "klären",
            "besprechen",
            "vorbereiten",
            "nachfragen"
        );

        if (generic.contains(normalized)) {
            return false;
        }

        String[] words = normalized.split("\\s+");
        return words.length >= 2;
    }

    private String normalizeAssignee(String value) {
        String clean = cleanText(value);

        if (clean.isBlank()) return "";

        String lower = clean.toLowerCase();

        if (Set.of("leer", "keine", "keiner", "unbekannt", "n/a", "none", "null").contains(lower)) {
            return "";
        }

        return clean;
    }

    private String normalizeDeadline(String value) {
        String clean = cleanText(value);

        if (clean.isBlank()) return "";

        try {
            return LocalDate.parse(clean).toString();
        } catch (Exception e) {
            return "";
        }
    }

    private String normalizePriority(String value) {
        String clean = cleanText(value).toUpperCase();

        if (Set.of("LOW", "MEDIUM", "HIGH").contains(clean)) {
            return clean;
        }

        return "MEDIUM";
    }

    private String cleanText(String value) {
        return value == null ? "" : value.replaceAll("\\s+", " ").trim();
    }

    /** String-Array oder Objekte -> eine Zeile pro Eintrag. */
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

    private String buildActionItems(List<ActionItem> items) {
        if (items == null || items.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();

        for (ActionItem item : items) {
            if (sb.length() > 0) sb.append("\n");

            sb.append(item.title());

            if (item.assignee() != null && !item.assignee().isBlank()) {
                sb.append(" [").append(item.assignee()).append("]");
            }

            if (item.deadline() != null && !item.deadline().isBlank()) {
                sb.append(" (bis ").append(item.deadline()).append(")");
            }

            if (item.priority() != null && !item.priority().isBlank()) {
                sb.append(" {").append(item.priority()).append("}");
            }
        }

        return sb.toString();
    }

    private MistralAnalysisResult createErrorResult(String reason) {
        String cleanReason = reason == null || reason.isBlank()
            ? "Unbekannter Analysefehler"
            : reason;

        MistralAnalysisResult result = new MistralAnalysisResult(
            "",
            "", "", "", "", "",
            cleanReason
        );

        result.setSuccessful(false);
        result.setErrorMessage(cleanReason);
        return result;
    }
}
