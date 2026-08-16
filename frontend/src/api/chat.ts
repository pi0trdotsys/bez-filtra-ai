import type { Message, TokenResponse, ChatEvent, MessageStats } from '@/types/chat'
import { notifyUnauthorized } from '@/lib/session'

const getToken = () => localStorage.getItem('token')

export async function fetchToken(password: string): Promise<string> {
  const res = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error('Nieprawidłowe hasło')
  const data: TokenResponse = await res.json()
  return data.token
}

export async function* streamChat(messages: Message[], opts: { model?: string; system?: string; signal?: AbortSignal } = {}): AsyncGenerator<ChatEvent> {
  const { model, system, signal } = opts
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
      ...(model ? { model } : {}),
      ...(system ? { system } : {}),
    }),
    signal,
  })

  if (res.status === 401) {
    notifyUnauthorized()
    throw new Error('Sesja wygasła - zaloguj się ponownie')
  }
  if (!res.ok) throw new Error('Błąd zapytania')

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // ostatni fragment może być niekompletny

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data) as { content?: string; error?: string; stats?: MessageStats }
        if (parsed.error) throw new Error(parsed.error)
        if (parsed.content) yield { content: parsed.content }
        if (parsed.stats) yield { stats: parsed.stats }
      } catch {
        // pomiń niepoprawne linie
      }
    }
  }
}
