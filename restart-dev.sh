#!/bin/bash
echo "Beende alte Prozesse auf Port 8080 (Backend) und 5173 (Frontend)..."
lsof -ti :8080 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null
sleep 1
echo "Starte Backend..."
cd /Users/suaybboncuk/meetingmind/backend
mvn spring-boot:run &
sleep 8
echo "Starte Frontend..."
cd /Users/suaybboncuk/meetingmind/frontend
npm run dev
