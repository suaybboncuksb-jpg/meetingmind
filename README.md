# MeetingMind 🧠

> AI-powered meeting protocol tool — automatically summarizes meetings and extracts action items using Google Gemini API.

## Problem it solves
After meetings, action items and decisions are often unclear or forgotten. MeetingMind lets teams capture meeting protocols and uses AI to automatically generate summaries and extract tasks — saving time and improving follow-through.

## Tech Stack
- **Backend:** Java 17, Spring Boot 3.5, Spring Data JPA
- **Database:** PostgreSQL
- **AI:** Google Gemini API (gemini-2.0-flash-lite)
- **Build:** Maven

## Features
- Create and manage meeting records
- Capture free-text meeting protocols
- AI-powered analysis: automatic summary + task extraction
- REST API ready for frontend integration

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meetings` | Get all meetings |
| GET | `/api/meetings/{id}` | Get meeting by ID |
| POST | `/api/meetings` | Create new meeting |
| PUT | `/api/meetings/{id}` | Update meeting |
| DELETE | `/api/meetings/{id}` | Delete meeting |
| POST | `/api/meetings/{id}/analyze` | Analyze protocol with Gemini AI |

## Quick Start

### Prerequisites
- Java 17+
- PostgreSQL
- Google Gemini API Key ([Get one here](https://aistudio.google.com))

### Setup
```bash
# Clone the repository
git clone https://github.com/suaybboncuksb-jpg/meetingmind.git
cd meetingmind

# Configure database and API key
# Edit src/main/resources/application.properties:
# spring.datasource.username=YOUR_DB_USER
# gemini.api.key=YOUR_GEMINI_KEY

# Run
./mvnw spring-boot:run
```

### Example: Analyze a meeting
```bash
# Create a meeting
curl -X POST http://localhost:8080/api/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sprint Planning",
    "location": "Conference Room A",
    "meetingDate": "2026-05-15T10:00:00",
    "protocolText": "Max will handle DB optimization by Friday. Sarah creates the dashboard by end of sprint."
  }'

# Analyze with AI (returns summary + extracted tasks)
curl -X POST http://localhost:8080/api/meetings/1/analyze
```

## Project Structure