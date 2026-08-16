// Klient panelu admina - osobna warstwa auth (PIN + krótkotrwały token w
// localStorage pod innym kluczem niż zwykła sesja czatu). Wymaga najpierw
// bycia zalogowanym normalnie (adminLogin wysyła zwykły token), ale sam
// podgląd rozmów/staty leci już wyłącznie na tokenie admina.

const getToken = () => localStorage.getItem('token')
const ADMIN_TOKEN_KEY = 'admin-token'

export interface ConversationLogRow {
  id: number
  ts: string
  ip: string | null
  model: string
  question: string
  answer: string
  error: string | null
  wallMs: number | null
  promptTok: number | null
  genTok: number | null
  tps: number | null
  energyKWh: number | null
  waterL: number | null
}

export interface AdminStats {
  totals: { conversations: number; promptTok: number; genTok: number; energyKWh: number; waterL: number }
  perModel: { model: string; count: number; avgTps: number | null; totalTokens: number; energyKWh: number }[]
  daily: { date: string; count: number }[]
}

export function hasAdminSession(): boolean {
  return !!localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export async function adminLogin(pin: string): Promise<void> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ pin }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Nie udało się zalogować do panelu')
  }
  const data = (await res.json()) as { token: string }
  localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
}

async function adminFetch(path: string): Promise<Response> {
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${localStorage.getItem(ADMIN_TOKEN_KEY)}` },
  })
  if (res.status === 401 || res.status === 403) {
    clearAdminSession()
    throw new Error('Sesja panelu wygasła - podaj PIN ponownie')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Błąd zapytania')
  }
  return res
}

export async function fetchAdminConversations(params: {
  limit: number
  offset: number
  q?: string
  model?: string
}): Promise<{ rows: ConversationLogRow[]; total: number }> {
  const qs = new URLSearchParams()
  qs.set('limit', String(params.limit))
  qs.set('offset', String(params.offset))
  if (params.q) qs.set('q', params.q)
  if (params.model) qs.set('model', params.model)
  const res = await adminFetch(`/api/admin/conversations?${qs.toString()}`)
  return res.json()
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await adminFetch('/api/admin/stats')
  return res.json()
}
