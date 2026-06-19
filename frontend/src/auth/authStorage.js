export const AUTH_TOKEN_KEY = 'authToken'
export const AUTH_USER_KEY = 'user'

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function hasAuthToken() {
  return Boolean(getAuthToken())
}

export function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY)) || null
  } catch {
    return null
  }
}

export function setAuthSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}
