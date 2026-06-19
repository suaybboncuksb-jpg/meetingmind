import { useState, useEffect, useCallback } from 'react'
import api from './api/client.js'
import {
  clearAuthSession,
  hasAuthToken,
  readStoredUser,
} from './auth/authStorage.js'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Meetings from './pages/Meetings.jsx'
import Tasks from './pages/Tasks.jsx'
import Settings from './pages/Settings.jsx'
import AppLayout from './components/AppLayout.jsx'
import CreateMeetingModal from './components/CreateMeetingModal.jsx'
import CreateTaskModal from './components/CreateTaskModal.jsx'
import './index.css'

function readTheme() {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [page, setPage] = useState('dashboard')
  const [meetings, setMeetings] = useState([])
  const [tasks, setTasks] = useState([])
  const [loadingMeetings, setLoadingMeetings] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleLogout = useCallback(() => {
    clearAuthSession()
    setUser(null)
    setIsAuthenticated(false)
    setMeetings([])
    setTasks([])
    setPage('dashboard')
    setShowCreate(false)
    setShowCreateTask(false)
    setLoadingMeetings(false)
  }, [])

  useEffect(() => {
    if (hasAuthToken()) {
      setIsAuthenticated(true)
      setUser(readStoredUser())
    }

    setAuthLoading(false)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => handleLogout()

    window.addEventListener('auth:logout', onUnauthorized)
    return () => window.removeEventListener('auth:logout', onUnauthorized)
  }, [handleLogout])

  const loadMeetings = useCallback(async () => {
    setLoadingMeetings(true)

    try {
      const res = await api.get('/meetings')
      setMeetings(Array.isArray(res.data) ? res.data : [])
    } catch {
      setMeetings([])
    } finally {
      setLoadingMeetings(false)
    }
  }, [])

  const loadTasks = useCallback(async () => {
    try {
      const res = await api.get('/tasks')
      setTasks(Array.isArray(res.data) ? res.data : [])
    } catch {
      setTasks([])
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadMeetings()
      loadTasks()
    } else {
      setLoadingMeetings(false)
    }
  }, [isAuthenticated, loadMeetings, loadTasks])

  const handleLogin = (value) => {
    setIsAuthenticated(value)

    if (value) {
      setUser(readStoredUser())
    }
  }

  const handleCreated = (meeting) => {
    setMeetings((prev) => [meeting, ...prev])
    setShowCreate(false)
  }

  const handleMeetingUpdated = (updated) => {
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
    loadTasks()
  }

  const handleTaskCreated = (task) => {
    setTasks((prev) => [task, ...prev])
    setShowCreateTask(false)
  }

  const handleTaskStatus = async (taskId, status) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))

    try {
      await api.put(`/tasks/${taskId}/status`, { status })
    } catch {
      loadTasks()
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span className="text-[14px] text-muted">Wird geladen…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login setIsAuthenticated={handleLogin} />
  }

  const openCreate = () => setShowCreate(true)

  const pages = {
    dashboard: (
      <Dashboard
        user={user}
        meetings={meetings}
        tasks={tasks}
        loading={loadingMeetings}
        onNewMeeting={openCreate}
        onNavigate={setPage}
      />
    ),
    meetings: (
      <Meetings
        meetings={meetings}
        loading={loadingMeetings}
        onNewMeeting={openCreate}
        onMeetingUpdated={handleMeetingUpdated}
      />
    ),
    tasks: (
      <Tasks
        tasks={tasks}
        onStatusChange={handleTaskStatus}
        onNewTask={() => setShowCreateTask(true)}
        onNavigate={setPage}
      />
    ),
    settings: <Settings user={user} theme={theme} onThemeChange={setTheme} />,
  }

  return (
    <>
      <AppLayout user={user} current={page} onNavigate={setPage} onLogout={handleLogout}>
        {pages[page] || pages.dashboard}
      </AppLayout>

      {showCreate && (
        <CreateMeetingModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}

      {showCreateTask && (
        <CreateTaskModal
          meetings={meetings}
          onClose={() => setShowCreateTask(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </>
  )
}

export default App
