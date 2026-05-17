# MeetingMind — Backend

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=flat-square&logo=spring-boot)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat-square&logo=postgresql)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=flat-square&logo=google)
![Maven](https://img.shields.io/badge/Maven-Build-C71A36?style=flat-square&logo=apache-maven)

> REST API Backend für MeetingMind — KI-gestütztes Meeting-Management mit Google Gemini AI.  
> Developed as a portfolio project for IT/AI consulting applications.

---

## Features

- **REST API** — Vollständige CRUD-Operationen für Meetings und Aufgaben
- **Google Gemini AI** — Automatische Protokoll-Analyse und Aufgaben-Erkennung
- **PostgreSQL** — Persistente Datenspeicherung mit JPA/Hibernate
- **Spring Boot** — Production-ready Backend mit Auto-Configuration
- **CORS** — Konfiguriert für Frontend-Kommunikation

---

## Tech Stack

| Technologie | Verwendung |
|---|---|
| Java 17 | Programmiersprache |
| Spring Boot 3.5 | Backend Framework |
| Spring Data JPA | Datenbank-Abstraktion |
| Hibernate | ORM |
| PostgreSQL 16 | Relationale Datenbank |
| Google Gemini AI | KI-Analyse (`gemini-2.0-flash-lite`) |
| Maven | Build Tool |
| Lombok | Boilerplate Reduktion |

---

## API Endpunkte

| Method | Endpoint | Beschreibung |
|---|---|---|
| `GET` | `/api/meetings` | Alle Meetings abrufen |
| `POST` | `/api/meetings` | Neues Meeting erstellen |
| `PUT` | `/api/meetings/{id}` | Meeting aktualisieren |
| `DELETE` | `/api/meetings/{id}` | Meeting löschen |
| `POST` | `/api/meetings/{id}/analyze` | KI-Analyse mit Gemini starten |

---

## Setup & Installation

### Voraussetzungen
- Java 17+
- PostgreSQL 16
- Google Gemini API Key ([kostenlos hier](https://ai.google.dev))

### Datenbank einrichten

```sql
CREATE DATABASE meetingmind;
```

### Konfiguration

`src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/meetingmind
spring.datasource.username=DEIN_USERNAME
spring.datasource.password=DEIN_PASSWORT
spring.jpa.hibernate.ddl-auto=update
gemini.api.key=DEIN_GEMINI_API_KEY
```

### Starten

```bash
git clone https://github.com/suaybboncuksb-jpg/meetingmind.git
cd meetingmind
./mvnw spring-boot:run
```

Das Backend läuft auf `http://localhost:8080`.

---

## Datenmodell

Meeting
├── id (Long)
├── title (String)
├── location (String)
├── meetingDate (LocalDateTime)
├── protocolText (String)
├── aiSummary (String)
├── createdAt (LocalDateTime)
├── tasks (List<Task>)
└── participants (List<String>)
Task
├── id (Long)
├── description (String)
├── assignedTo (String)
├── dueDate (String)
└── status (String)
---

## KI-Integration

Die Gemini AI Integration analysiert Meeting-Protokolle und erstellt:
- Eine strukturierte Zusammenfassung
- Eine Liste erkannter Aufgaben mit Verantwortlichen und Fristen

```java
// GeminiService sendet Protokolltext an Gemini API
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent
```

---

## Related

- [MeetingMind Frontend](https://github.com/suaybboncuksb-jpg/meetingmind-frontend) — React + Web Speech API + jsPDF

---

*Portfolio Projekt · Wirtschaftsinformatik · IT/KI-Beratung*# MeetingMind — Backend

