# MeetingMind

**KI-basiertes Meeting-Management-Tool für kleine Teams und Unternehmen.**

MeetingMind hilft dabei, Meeting-Protokolle zu strukturieren, KI-Zusammenfassungen zu erzeugen und daraus konkrete Aufgaben mit Status, Priorität, Zuständigkeit und Deadline zu erstellen.

## Aktueller MVP-Stand

- JWT-basierte Registrierung und Anmeldung
- Geschützte API-Endpunkte
- Mandantentrennung: Nutzer sehen und bearbeiten nur eigene Meetings und Tasks
- Meeting-Erstellung
- Task-Erstellung
- KI-Analyse von Meeting-Transkripten
- Automatische Aufgaben aus Action Items
- Einheitliche API-Fehlermeldungen
- Frontend-Fehleranzeige
- React/Vite Frontend mit SaaS-orientiertem UI

## Projektstruktur

```text
meetingmind/
├── backend/          # Spring Boot API
├── frontend/         # React + Vite Frontend
├── README.md
├── .gitignore
└── .env.example
```

## Tech Stack

### Backend

- Java 17
- Spring Boot 3.1.5
- Maven
- PostgreSQL
- Spring Security
- JWT
- JPA/Hibernate
- Mistral AI API

### Frontend

- React
- Vite
- Axios
- Tailwind CSS
- Lokale Auth-Session über localStorage

## Voraussetzungen

- Java 17 empfohlen
- Maven 3.9+
- Node.js 18+
- PostgreSQL lokal oder per Docker
- Git

Prüfen:

```bash
java -version
mvn -version
node -v
npm -v
```

Hinweis: Das Projekt ist auf Java 17 konfiguriert. Falls Maven mit einer neueren Java-Version läuft, kann das lokal funktionieren, sollte aber für Stabilität auf Java 17 umgestellt werden.

## Lokale Datenbank

Standardwerte der App:

```text
Host: 127.0.0.1
Port: 5432
Database: meetingmind
User: meetingmind_user
Password: meetingmind_password
```

Die Werte können über Umgebungsvariablen überschrieben werden:

```bash
export DATABASE_URL="jdbc:postgresql://127.0.0.1:5432/meetingmind"
export DATABASE_USERNAME="meetingmind_user"
export DATABASE_PASSWORD="meetingmind_password"
```

## Backend starten

Aus dem Projektroot:

```bash
mvn -f backend/pom.xml spring-boot:run
```

Backend läuft unter:

```text
http://localhost:8080/api
```

Health Check:

```bash
curl -i http://localhost:8080/api/health
```

## Frontend starten

Aus dem Projektroot:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Frontend läuft unter:

```text
http://localhost:5173
```

Wichtig: Lokal bevorzugt `localhost:5173` verwenden, nicht `127.0.0.1:5173`, da die lokale CORS-Konfiguration aktuell auf localhost ausgelegt ist.

## Tests und Builds

Backend-Test:

```bash
mvn -f backend/pom.xml clean test
```

Frontend-Build:

```bash
npm --prefix frontend run build
```

## Wichtige Umgebungsvariablen

```bash
export JWT_SECRET="replace-with-secure-secret"
export MISTRAL_API_KEY="replace-with-api-key"
export JWT_EXPIRATION_MS="86400000"
```

Für lokale Entwicklung sind Defaults vorhanden. In Produktion müssen Secrets immer über Umgebungsvariablen gesetzt werden.

## Git-Workflow

Neuen Sprint starten:

```bash
git switch main
git pull
git switch -c feature/<sprint-name>
```

Nach erfolgreichem Test:

```bash
git add .
git commit -m "type: short description"
git switch main
git merge feature/<sprint-name>
git push origin main
```

## Aktueller Fokus

MeetingMind soll schrittweise zu einem verkaufsfähigen SaaS-MVP ausgebaut werden. Technische Entscheidungen sollen daher sicher, wartbar, nutzerfreundlich und später deploymentfähig sein.

## Lizenz

MIT
