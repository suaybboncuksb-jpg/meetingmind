package com.meetingmind.ai;

/** Strukturiertes Action Item aus der KI-Analyse. deadline als ISO-Datum (YYYY-MM-DD) oder leer. */
public record ActionItem(String title, String assignee, String deadline) {
}
