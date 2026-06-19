# MeetingMind

**KI-basiertes Meeting-Management-Tool für kleine und mittelständische Unternehmen.**

MeetingMind macht aus Online-Meetings automatisch klare Aufgaben, Verantwortlichkeiten und Deadlines – sichtbar für das gesamte Team und für jede einzelne Person.

## 🎯 Kernnutzen

- Automatische Transkripterstellung und Analyse
- KI-gestützte Zusammenfassungen
- Automatische Aufgabenerstellung mit Zuweisungen
- Deadline-Management
- Team- und Personalübersicht
- Kalenderintegration

## 🏗️ Projektstruktur (Monorepo)
meetingmind/

├── backend/          # Java Spring Boot API

├── frontend/         # React + Vite

├── docs/             # Dokumentation

├── docker-compose.yml

├── README.md

└── .gitignore

## 🛠️ Tech Stack

### Backend
- **Java 17** mit Spring Boot
- **Maven** für Dependency Management
- **PostgreSQL** als Datenbank
- **JPA/Hibernate** für ORM
- **JWT** für Authentication (später)
- **REST API**

### Frontend
- **React** mit Vite
- **JavaScript** & CSS
- **Axios** für API-Requests
- **Apple-inspiriertes SaaS Design**

### AI Integration
- **Mistral API** für Transkribierung und Analyse

### Database
- **PostgreSQL** (lokal via Docker Compose)

## 🚀 Quick Start

### Voraussetzungen
- Java 17+
- Node.js 16+
- Docker & Docker Compose
- Git

### 1. Datenbank starten
```bash
docker-compose up -d
```

### 2. Backend starten
```bash
cd backend
./mvnw spring-boot:run
```

Backend läuft unter: `http://localhost:8080`

### 3. Frontend starten
```bash
cd frontend
npm install
npm run dev
```

Frontend läuft unter: `http://localhost:5173`

## 📋 MVP Features

- [ ] Login/Register
- [ ] Workspace/Unternehmen
- [ ] Dashboard
- [ ] Meeting erstellen
- [ ] Transkript einfügen/hochladen
- [ ] KI-Analyse starten (Mistral)
- [ ] Zusammenfassung anzeigen
- [ ] Aufgaben automatisch erstellen
- [ ] Aufgaben Personen zuweisen
- [ ] Kalenderansicht (Woche, Monat, Jahr)
- [ ] Teamansicht
- [ ] Einzelpersonenansicht
- [ ] PDF-Export
- [ ] Settings

## 📚 Dokumentation

Weitere Dokumentation findest du im `/docs` Ordner.

## 📝 License

MIT

---

**Entwickler:** MeetingMind Team
