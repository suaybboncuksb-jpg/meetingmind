export function getApiErrorMessage(error, fallback = 'Ein unerwarteter Fehler ist aufgetreten.') {
  const data = error?.response?.data

  if (!error?.response) {
    return 'Backend nicht erreichbar. Bitte prüfe, ob der Server läuft.'
  }

  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }

  if (data?.message) {
    return data.message
  }

  if (data?.error) {
    return data.error
  }

  return fallback
}
