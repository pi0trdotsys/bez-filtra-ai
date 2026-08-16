import { useState } from 'react'
import { motion } from 'framer-motion'
import { fetchToken } from '@/api/chat'

interface LoginScreenProps {
  onLogin: () => void
  notice?: string | null
}

export function LoginScreen({ onLogin, notice }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = await fetchToken(password)
      localStorage.setItem('token', token)
      onLogin()
    } catch {
      setError('Nieprawidłowe hasło')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'}}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm mx-4"
      >
        <div className="text-center mb-9">
          <div
            className="inline-flex items-center justify-center mb-5"
            style={{
              width: 46, height: 46, borderRadius: 14,
              background: 'linear-gradient(135deg,#a78bfa,#60a5fa)',
              boxShadow: '0 8px 28px rgba(120,80,255,0.35)',
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 5, background: '#0f0c29' }} />
          </div>
          <h1 className="text-3xl tracking-tight mb-2" style={{ fontWeight: 600 }}>
            <span style={{ color: 'rgba(255,255,255,0.95)' }}>Bez</span>{' '}
            <span style={{
              background: 'linear-gradient(135deg,#a78bfa,#60a5fa)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Filtra</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }} className="text-sm">
            Odpowiedź na każde pytanie
          </p>
          <p
            className="mt-5"
            style={{ fontSize: 10, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}
          >
            bez cenzury · bez tematów tabu
          </p>
        </div>

        {notice && !error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-sm text-center mb-4 rounded-lg px-3 py-2"
            style={{ color: 'rgba(251,191,36,0.9)', background: 'rgba(251,191,36,0.1)', border: '0.5px solid rgba(251,191,36,0.25)' }}
          >
            ⏳ {notice}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Hasło"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              background:'rgba(255,255,255,0.07)',
              border:'0.5px solid rgba(255,255,255,0.15)',
              color:'rgba(255,255,255,0.9)',
            }}
            autoFocus
          />
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
              {error}
            </motion.p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl py-3 text-sm font-medium transition-opacity disabled:opacity-40"
            style={{background:'linear-gradient(135deg,#a78bfa,#60a5fa)',color:'white'}}
          >
            {loading ? 'Logowanie...' : 'Wejdź'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
