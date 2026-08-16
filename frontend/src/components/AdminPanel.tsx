import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  adminLogin, hasAdminSession, clearAdminSession,
  fetchAdminConversations, fetchAdminStats,
  type ConversationLogRow, type AdminStats,
} from '@/lib/admin'

const PAGE_SIZE = 25

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [authed, setAuthed] = useState(hasAdminSession())
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'stats' | 'logs'>('stats')

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setPinError('')
    try {
      await adminLogin(pin)
      setAuthed(true)
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Błąd')
    } finally {
      setLoading(false)
    }
  }

  const handleLock = () => {
    clearAdminSession()
    setAuthed(false)
    setPin('')
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(5,4,15,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full flex flex-col overflow-hidden rounded-2xl"
        style={{
          maxWidth: authed ? 900 : 380,
          maxHeight: '85vh',
          background: 'rgba(22,19,46,0.97)', backdropFilter: 'blur(24px)',
          border: '0.5px solid rgba(var(--accent-rgb),0.25)', boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
        }}
      >
        {!authed ? (
          <form onSubmit={handlePinSubmit} className="p-6 flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>🔒 Panel statystyk</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Podaj PIN, żeby zobaczyć wszystkie rozmowy i statystyki.
              </p>
            </div>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="PIN"
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
            />
            {pinError && <p className="text-xs" style={{ color: '#f87171' }}>{pinError}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading || !pin}
                className="text-sm px-4 py-1.5 rounded-lg font-medium disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,rgb(var(--accent-rgb)),rgba(var(--accent-rgb),0.55))', color: '#fff' }}
              >
                {loading ? 'Sprawdzam…' : 'Wejdź'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-1">
                <TabButton active={tab === 'stats'} onClick={() => setTab('stats')}>📊 Statystyki</TabButton>
                <TabButton active={tab === 'logs'} onClick={() => setTab('logs')}>💬 Rozmowy</TabButton>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={handleLock} className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>🔒 Zablokuj</button>
                <button onClick={onClose} className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {tab === 'stats' ? <StatsTab /> : <LogsTab />}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
      style={{
        background: active ? 'rgba(var(--accent-rgb),0.16)' : 'transparent',
        color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
      }}
    >
      {children}
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{label}</p>
      <p className="mt-1" style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.92)', fontFamily: 'ui-monospace,monospace' }}>
        {value}
      </p>
    </div>
  )
}

function StatsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAdminStats().then(setStats).catch(err => setError(err instanceof Error ? err.message : 'Błąd'))
  }, [])

  if (error) return <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
  if (!stats) return <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Ładowanie…</p>

  const { totals, perModel } = stats
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Rozmowy" value={totals.conversations.toLocaleString('pl-PL')} />
        <StatCard label="Tokeny" value={(totals.promptTok + totals.genTok).toLocaleString('pl-PL')} />
        <StatCard label="Energia" value={`${(totals.energyKWh * 1000).toFixed(1)} Wh`} />
        <StatCard label="Woda" value={`${(totals.waterL * 1000).toFixed(0)} ml`} />
      </div>

      <div>
        <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Per model</p>
        <div className="overflow-x-auto rounded-xl" style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}>
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Model', 'Rozmowy', 'Śr. tok/s', 'Tokeny', 'Energia'].map(h => (
                  <th key={h} className="text-left px-3 py-2" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perModel.map(m => (
                <tr key={m.model} style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <td className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.85)' }}>{m.model}</td>
                  <td className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{m.count}</td>
                  <td className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{m.avgTps ?? '–'}</td>
                  <td className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{m.totalTokens.toLocaleString('pl-PL')}</td>
                  <td className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{(m.energyKWh * 1000).toFixed(1)} Wh</td>
                </tr>
              ))}
              {perModel.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-4 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Brak danych</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {stats.daily.length > 0 && (
        <div>
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Ostatnie 14 dni</p>
          <div className="flex items-end gap-1" style={{ height: 60 }}>
            {stats.daily.map(d => {
              const max = Math.max(...stats.daily.map(x => x.count), 1)
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${d.date}: ${d.count}`}>
                  <div
                    className="w-full rounded-sm"
                    style={{ height: `${Math.max(4, (d.count / max) * 48)}px`, background: 'rgba(var(--accent-rgb),0.5)' }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function LogsTab() {
  const [rows, setRows] = useState<ConversationLogRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [qDraft, setQDraft] = useState('')
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  useEffect(() => {
    fetchAdminConversations({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, q: q || undefined })
      .then(d => { setRows(d.rows); setTotal(d.total) })
      .catch(err => setError(err instanceof Error ? err.message : 'Błąd'))
  }, [page, q])

  const search = () => { setPage(0); setQ(qDraft.trim()) }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={qDraft}
          onChange={e => setQDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') search() }}
          placeholder="Szukaj w pytaniach/odpowiedziach…"
          className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)' }}
        />
        <button onClick={search} className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--accent-rgb),0.16)', color: 'rgba(255,255,255,0.9)' }}>
          Szukaj
        </button>
      </div>

      {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{total.toLocaleString('pl-PL')} rozmów</p>

      <div className="flex flex-col gap-1.5">
        {rows.map(r => {
          const expanded = expandedId === r.id
          return (
            <div key={r.id} className="rounded-lg overflow-hidden" style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setExpandedId(expanded ? null : r.id)}
                className="w-full text-left px-3 py-2 flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'ui-monospace,monospace', whiteSpace: 'nowrap' }}>
                  {r.ts.replace('T', ' ').replace(/\..*/, '')}
                </span>
                <span style={{ fontSize: 10, color: 'rgb(var(--accent-rgb))', whiteSpace: 'nowrap' }}>{r.model}</span>
                <span className="truncate flex-1" style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{r.question}</span>
                {r.tps != null && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{r.tps} tok/s</span>}
              </button>
              {expanded && (
                <div className="px-3 py-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>❓ Pytanie</p>
                  <p className="whitespace-pre-wrap" style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>{r.question}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>💬 Odpowiedź</p>
                  <p className="whitespace-pre-wrap" style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                    {r.answer || (r.error ? `[BŁĄD: ${r.error}]` : '(brak)')}
                  </p>
                  {r.tps != null && (
                    <p className="mt-3" style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'ui-monospace,monospace' }}>
                      {r.promptTok}→{r.genTok} tok · {r.tps} tok/s
                      {r.wallMs != null && ` · ${(r.wallMs / 1000).toFixed(1)}s`}
                      {r.energyKWh != null && ` · ⚡ ${(r.energyKWh * 1000).toFixed(2)} Wh`}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {rows.length === 0 && !error && (
          <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>Brak wyników</p>
        )}
      </div>

      {maxPage > 0 && (
        <div className="flex items-center justify-center gap-3 mt-1">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-xs px-2 py-1 disabled:opacity-30" style={{ color: 'rgba(255,255,255,0.6)' }}>
            ← Poprzednia
          </button>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{page + 1} / {maxPage + 1}</span>
          <button disabled={page >= maxPage} onClick={() => setPage(p => p + 1)} className="text-xs px-2 py-1 disabled:opacity-30" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Następna →
          </button>
        </div>
      )}
    </div>
  )
}
