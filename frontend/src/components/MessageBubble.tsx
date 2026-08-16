import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Message } from '@/types/chat'
import { Markdown } from './Markdown'
import { ThinkingBars } from './ThinkingIndicator'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  isLast?: boolean
  onRegenerate?: () => void
  onEdit?: (id: string, content: string) => void
}

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors"
      style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}
      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
    >
      {children}
    </button>
  )
}

export function MessageBubble({ message, isStreaming, isLast, onRegenerate, onEdit }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* brak schowka */ }
  }

  const startEdit = () => { setDraft(message.content); setEditing(true) }
  const saveEdit = () => {
    const text = draft.trim()
    setEditing(false)
    if (text && text !== message.content) onEdit?.(message.id, text)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group flex gap-2 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full text-base"
        style={{
          width: 28, height: 28,
          background: isUser
            ? 'rgba(255,255,255,0.1)'
            : 'linear-gradient(135deg,rgba(var(--accent-rgb),0.3),rgba(96,165,250,0.3))',
          border: isUser
            ? '0.5px solid rgba(255,255,255,0.15)'
            : '0.5px solid rgba(var(--accent-rgb),0.3)',
        }}
      >
        {isUser ? '👤' : '🐬'}
      </div>

      <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="px-3 py-2 text-sm leading-relaxed w-full"
          style={{
            borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: isUser ? 'rgba(var(--accent-rgb),0.2)' : 'rgba(255,255,255,0.06)',
            border: isUser ? '0.5px solid rgba(var(--accent-rgb),0.3)' : '0.5px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {editing ? (
            <div className="flex flex-col gap-2" style={{ minWidth: 220 }}>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
                  if (e.key === 'Escape') setEditing(false)
                }}
                autoFocus
                rows={Math.min(8, draft.split('\n').length + 1)}
                className="bg-transparent border-none outline-none text-sm resize-none w-full"
                style={{ color: 'rgba(255,255,255,0.95)', lineHeight: '1.5', fontFamily: 'inherit' }}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(false)} className="text-xs px-2 py-1 rounded-md" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Anuluj
                </button>
                <button
                  onClick={saveEdit}
                  className="text-xs px-2.5 py-1 rounded-md"
                  style={{ background: 'linear-gradient(135deg,rgb(var(--accent-rgb)),rgba(var(--accent-rgb),0.55))', color: '#fff' }}
                >
                  Zapisz i wyślij
                </button>
              </div>
            </div>
          ) : isStreaming && !message.content ? (
            <span className="flex items-center py-0.5">
              <ThinkingBars />
            </span>
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : isStreaming ? (
            <Markdown content={message.content} />
          ) : (
            <>
              <Markdown content={message.content} />

              {/* Statystyki - pokazują się zarówno po normalnym zakończeniu jak i po przerwaniu */}
              {message.stats && (() => {
                const s = message.stats
                const interrupted = (s as any).interrupted === true
                const parts: { icon: string; value: string; title: string }[] = [
                  { icon: '📊', value: `${s.promptTok} → ${s.genTok} tok`, title: 'tokeny wejściowe → wygenerowane' },
                  { icon: '⚡', value: `${s.tps.toString().replace('.', ',')} tok/s`, title: 'prędkość generowania' },
                ]
                if (s.responseTimeMs != null)
                  parts.push({ icon: '⏱️', value: `${(s.responseTimeMs / 1000).toFixed(1)} s`, title: 'czas odpowiedzi' })
                if (s.energyKWh != null)
                  parts.push({ icon: '🔋', value: `${(s.energyKWh * 1000).toFixed(2)} Wh`, title: 'zużycie energii' })
                if (s.waterL != null)
                  parts.push({ icon: '💧', value: `${(s.waterL * 1000).toFixed(1)} ml`, title: 'zużycie wody (chłodzenie)' })
                return (
                  <div className="mt-2 pt-1.5 flex flex-wrap gap-x-3 gap-y-1 items-center" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                    {interrupted && (
                      <span style={{ fontSize: 10, color: 'rgba(248,113,113,0.8)', letterSpacing: '0.04em' }}>
                        ⏹️ przerwano
                      </span>
                    )}
                    {parts.map(p => (
                      <span
                        key={p.icon}
                        title={p.title}
                        className="flex items-center gap-1"
                        style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.01em' }}
                      >
                        <span>{p.icon}</span>
                        <span>{p.value}</span>
                      </span>
                    ))}
                  </div>
                )
              })()}
            </>
          )}
        </div>

        {/* Pasek akcji */}
        {!editing && !isStreaming && (
          <div
            className={`hover-actions flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{fmtTime(message.createdAt)}</span>
            {!isUser && message.content && (
              <IconButton onClick={copy} label={copied ? 'Skopiowano' : 'Kopiuj odpowiedź'}>
                {copied ? '✓ skopiowano' : '⧉ kopiuj'}
              </IconButton>
            )}
            {!isUser && isLast && onRegenerate && (
              <IconButton onClick={onRegenerate} label="Wygeneruj odpowiedź od nowa">↻ ponów</IconButton>
            )}
            {isUser && onEdit && (
              <IconButton onClick={startEdit} label="Edytuj i wyślij ponownie">✎ edytuj</IconButton>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
