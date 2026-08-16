import { useEffect, useState } from 'react'
import { LoginScreen } from '@/components/LoginScreen'
import { ChatWindow } from '@/components/ChatWindow'
import { setUnauthorizedHandler, refreshToken } from '@/lib/session'

// Jak często odświeżamy token w tle, dopóki appka jest otwarta (sliding
// expiration - patrz TOKEN_TTL w backend/src/index.ts). Nie musi być często:
// token żyje 30 dni, więc kilka razy dziennie w zupełności wystarcza.
const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('token')
  )
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  // Jeden globalny handler na "401 gdziekolwiek w appce" - patrz lib/session.ts.
  // Zamiast cichego, wracającego przy każdej wiadomości "błędu odpowiedzi",
  // od razu czyścimy martwy token i wracamy na ekran logowania z wyjaśnieniem.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem('token')
      setIsAuthenticated(false)
      setSessionNotice('Twoja sesja wygasła - zaloguj się ponownie.')
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  // Sliding expiration: odśwież token zaraz po starcie appki, potem cyklicznie
  // w tle, i od razu gdy karta wraca na pierwszy plan po dłuższej przerwie
  // (np. laptop spał kilka dni - interwał w tle mógł nie zdążyć odpalić).
  useEffect(() => {
    if (!isAuthenticated) return
    refreshToken()
    const id = setInterval(refreshToken, REFRESH_INTERVAL_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') refreshToken() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isAuthenticated])

  return isAuthenticated
    ? <ChatWindow onLogout={handleLogout} />
    : (
      <LoginScreen
        notice={sessionNotice}
        onLogin={() => { setSessionNotice(null); setIsAuthenticated(true) }}
      />
    )
}
