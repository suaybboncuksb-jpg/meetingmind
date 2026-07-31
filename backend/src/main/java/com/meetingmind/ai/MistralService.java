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

        StringBuilder sb = new StringBuilder();
        sb.append("Du bist ein praeziser Assistent fuer deutschsprachige Meeting-Analyse, speziell fuer Kanzleien.\n");
        sb.append("Heutiges Datum: ").append(today).append(".\n\n");
        sb.append("Deine Aufgabe:\n");
        sb.append("Extrahiere nur echte, umsetzbare Arbeitsergebnisse aus dem Meeting.\n\n");
        sb.append("Antworte AUSSCHLIESSLICH mit gueltigem JSON in genau diesem Schema:\n");
        sb.append("{\n");
        sb.append("  \"summary\": \"2-3 Saetze Zusammenfassung\",\n");
        sb.append("  \"keyPoints\": [\"wichtiger Punkt\", \"...\"],\n");
        sb.append("  \"decisions\": [\"konkrete Entscheidung\", \"...\"],\n");
        sb.append("  \"actionItems\": [\n");
        sb.append("    {\n");
        sb.append("      \"title\": \"konkrete Aufgabe mit Ergebnis\",\n");
        sb.append("      \"assignee\": \"Name der verantwortlichen Person oder leer\",\n");
        sb.append("      \"deadline\": \"YYYY-MM-DD oder leer\",\n");
        sb.append("      \"priority\": \"LOW | MEDIUM | HIGH\"\n");
        sb.append("    }\n");
        sb.append("  ],\n");
        sb.append("  \"deadlines\": [\n");
        sb.append("    {\n");
        sb.append("      \"description\": \"worum es bei der Frist geht\",\n");
        sb.append("      \"date\": \"YYYY-MM-DD oder leer, falls nicht einmal geschaetzt werden kann\"\n");
        sb.append("    }\n");
        sb.append("  ],\n");
        sb.append("  \"nextSteps\": [\"naechster Schritt\", \"...\"],\n");
        sb.append("  \"questions\": [\"offene Frage\", \"...\"]\n");
        sb.append("}\n\n");
        sb.append("Regeln fuer actionItems:\n");
        sb.append("- Nur echte To-dos aufnehmen, keine allgemeinen Stichpunkte.\n");
        sb.append("- Jede Aufgabe muss als konkretes Ergebnis formuliert sein.\n");
        sb.append("- Schlechte Titel wie 'Pruefen', 'Klaeren', 'Besprechen', 'Todo', 'Test' vermeiden.\n");
        sb.append("- Besser: 'Angebotszahlen pruefen', 'Technische Fragen mit Kunden klaeren'.\n");
        sb.append("- Wenn eine Person sagt 'ich uebernehme...', dann ist diese Person assignee.\n");
        sb.append("- Wenn ein Sprecher klar eine Aufgabe uebernimmt, nutze den Sprechernamen als assignee.\n");
        sb.append("- Relative Fristen wie 'bis Freitag', 'naechste Woche', 'in 3 Tagen' ausgehend vom heutigen Datum in YYYY-MM-DD umwandeln.\n");
        sb.append("- Wenn keine Frist explizit genannt wird, aber der Kontext eine plausible Einschaetzung zulaesst\n");
        sb.append("  (z.B. gesetzliche Fristen, typische Bearbeitungsdauer, Bezug auf ein anderes Datum im Gespraech),\n");
        sb.append("  schaetze ein realistisches Datum. Nur wenn wirklich kein Anhaltspunkt existiert, deadline auf \"\" setzen.\n");
        sb.append("- HIGH bei dringenden, kundenkritischen, blockierenden oder kurzfristigen Aufgaben.\n");
        sb.append("- MEDIUM bei normalen Aufgaben.\n");
        sb.append("- LOW bei optionalen oder weniger dringenden Aufgaben.\n");
        sb.append("- Keine Duplikate erzeugen.\n\n");
        sb.append("Regeln fuer deadlines (eigenstaendige Fristen, unabhaengig von actionItems):\n");
        sb.append("- Erfasse Fristen, die im Gespraech erwaehnt werden, aber NICHT eindeutig einer bestimmten\n");
        sb.append("  Aufgabe/Person zugeordnet sind (z.B. gesetzliche Fristen, Verfahrensfristen, Termine).\n");
        sb.append("- Auch hier: wenn kein explizites Datum genannt wird, aber der Kontext eine Schaetzung zulaesst,\n");
        sb.append("  schaetze das Datum. Nur bei voelliger Unklarheit date auf \"\" setzen.\n");
        sb.append("- Keine Frist doppelt aufnehmen, die bereits eindeutig einem actionItem zugeordnet ist.\n\n");
        sb.append("Allgemein:\n");
        sb.append("- Verwende leere Arrays, wenn nichts zutrifft.\n");
        sb.append("- Kein Text ausserhalb des JSON.\n");

        return sb.toString();
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
                        "Analysiere das folgende Meeting-Transkript und extrahiere praezise Aufgaben und Fristen:\n\n" + transcript)
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
        List<DeadlineItem> deadlineItems = extractDeadlineItems(data.path("deadlines"));

        MistralAnalysisResult result = new MistralAnalysisResult(
            data.path("summary").asText(""),
            joinLines(data.path("keyPoints")),
            joinLines(data.path("decisions")),
            buildActionItems(actionItems),
            joinLines(data.path("nextSteps")),
            joinLines(data.path("questions")),
            buildDeadlines(deadlineItems),
            content
        );

        result.setActionItemList(actionItems);
        result.setDeadlineList(deadlineItems);
        return result;
    }

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

    private List<DeadlineItem> extractDeadlineItems(JsonNode array) {
        List<DeadlineItem> items = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();

        if (array == null || !array.isArray()) {
            return items;
        }

        for (JsonNode node : array) {
            String description;
            String date;

            if (node.isTextual()) {
                description = node.asText("");
                date = "";
            } else {
                description = node.path("description").asText("");
                date = node.path("date").asText("");
            }

            String cleanDescription = cleanText(description)
                .replaceAll("^[\\-•*]+\\s*", "")
                .replaceAll("\\.$", "")
                .trim();

            if (cleanDescription.isBlank() || cleanDescription.length() < 5) {
                continue;
            }

            String cleanDate = normalizeDeadline(date);
            String key = (cleanDescription + "|" + cleanDate).toLowerCase();

            if (seen.add(key)) {
                items.add(new DeadlineItem(cleanDescription, cleanDate));
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
            "pruefen",
            "klaeren",
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

    private String buildDeadlines(List<DeadlineItem> items) {
        if (items == null || items.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();

        for (DeadlineItem item : items) {
            if (sb.length() > 0) sb.append("\n");

            sb.append(item.description());

            if (item.date() != null && !item.date().isBlank()) {
                sb.append(" (").append(item.date()).append(")");
            } else {
                sb.append(" (Datum unklar)");
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
            "", "", "", "", "", "",
            cleanReason
        );

        result.setSuccessful(false);
        result.setErrorMessage(cleanReason);
        return result;
    }
}