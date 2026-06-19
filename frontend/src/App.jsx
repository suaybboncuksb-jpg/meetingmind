import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Meetings from './pages/Meetings.jsx'
import Tasks from './pages/Tasks.jsx'
import Settings from './pages/Settings.jsx'
import AppLayout from './components/AppLayout.jsx'
import CreateMeetingModal from './components/CreateMeetingModal.jsx'
import CreateTaskModal from './components/CreateTaskModal.jsx'
import './index.css'

const API = 'http://localhost:8080/api'

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null
  } catch {
    return null
  }
}

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

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      setIsAuthenticated(true)
      setUser(readUser())
    }
    setAuthLoading(false)
  }, [])

  const loadMeetings = useCallback(async (uid) => {
    if (!uid) {
      setLoadingMeetings(false)
      return
    }
    setLoadingMeetings(true)
    try {
      const res = await axios.get(`${API}/meetings`, { params: { userId: uid } })
      setMeetings(Array.isArray(res.data) ? res.data : [])
    } catch {
      setMeetings([])
    } finally {
      setLoadingMeetings(false)
    }
  }, [])

  const loadTasks = useCallback(async (uid) => {
    if (!uid) return
    try {
      const res = await axios.get(`${API}/tasks`, { params: { userId: uid } })
      setTasks(Array.isArray(res.data) ? res.data : [])
    } catch {
      setTasks([])
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadMeetings(user.id)
      loadTasks(user.id)
    }
  }, [isAuthenticated, user?.id, loadMeetings, loadTasks])

  const handleLogin = (value) => {
    setIsAuthenticated(value)
    if (value) setUser(readUser())
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
    setMeetings([])
    setTasks([])
    setPage('dashboard')
  }

  const handleCreated = (meeting) => {
    setMeetings((prev) => [meeting, ...prev])
    setShowCreate(false)
  }

  const handleMeetingUpdated = (updated) => {
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
    // Analyse kann Aufgaben erzeugt haben → neu laden
    if (user?.id) loadTasks(user.id)
  }

  const handleTaskCreated = (task) => {
    setTasks((prev) => [task, ...prev])
    setShowCreateTask(false)
  }

  const handleTaskStatus = async (taskId, status) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
    try {
      await axios.put(`${API}/tasks/${taskId}/status`, { status })
    } catch {
      if (user?.id) loadTasks(user.id)
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
        <CreateMeetingModal userId={user?.id} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}

      {showCreateTask && (
        <CreateTaskModal
          userId={user?.id}
          meetings={meetings}
          onClose={() => setShowCreateTask(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </>
  )
}

export default App
