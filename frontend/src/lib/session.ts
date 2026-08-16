// Centralny punkt reagowania na "sesja wygasła" (401 z backendu) - hooki typu
// useChat/useModels nie mają dostępu do stanu logowania w App.tsx, więc zamiast
// przekazywać onLogout przez pół drzewa komponentów, rejestrujemy tu jeden
// callback wywoływany z dowolnego miejsca robiącego fetch do /api/*.
let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn
}

export function notifyUnauthorized() {
  unauthorizedHandler?.()
}

// Odśwież token, dopóki poprzedni jest jeszcze ważny (sliding expiration) -
// wywoływane przy starcie appki i cyklicznie w tle. Zwraca false przy realnym
// braku autoryzacji (401 - stary token faktycznie wygasł, trzeba się zalogować
// ponownie) - w takim wypadku sam już zgłasza notifyUnauthorized().
// Błędy sieciowe (offline, serwer chwilowo niedostępny) są ignorowane - to nie
// jest powód do wylogowania, spróbujemy ponownie przy kolejnej okazji.
export async function refreshToken(): Promise<boolean> {
  const token = localStorage.getItem('token')
  if (!token) return false
  try {
    const res = await fetch('/api/token/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) {
      notifyUnauthorized()
      return false
    }
    if (!res.ok) return false // błąd sieci/serwera - spróbujemy przy następnej okazji
    const data = (await res.json()) as { token: string }
    localStorage.setItem('token', data.token)
    return true
  } catch {
    return false
  }
}
