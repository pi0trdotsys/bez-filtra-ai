import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { describeModel, type ModelEntry } from '@/lib/models'
import type { Conversation } from '@/lib/conversations'

interface CommandPaletteProps {
  onClose: () => void
  conversations: Conversation[]
  models: ModelEntry[]
  selectedModel: string
  defaultModel: string
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onSelectModel: (name: string) => void
  onOpenPersona: () => void
}

interface Item {
  key: string
  icon: string
  label: string
  sub?: string
  run: () => void
}

export function CommandPalette({
  onClose, conversations, models, selectedModel, defaultModel,
  onNewChat, onSelectConversation, onSelectModel, onOpenPersona,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const q = query.trim().toLowerCase()
  const current = selectedModel || defaultModel

  const items = useMemo<Item[]>(() => {
    const out: Item[] = []
    const match = (s: string) => s.toLowerCase().includes(q)

    // Akcje
    const actions: Item[] = [
      { key: 'new', icon: '＋', label: 'Nowa rozmowa', run: onNewChat },
      { key: 'persona', icon: '🎭', label: 'Ustaw personę rozmowy', run: onOpenPersona },
    ]
    out.push(...actions.filter(a => !q || match(a.label)))

    // Modele
    for (const m of models) {
      const meta = describeModel(m.name)
      if (q && !match(meta.label) && !match(m.name)) continue
      out.push({
        key: 'model:' + m.name,
        icon: meta.emoji,
        label: `Model: ${meta.label}`,
        sub: m.name === current ? 'aktywny' : meta.tags.join(' · '),
        run: () => onSelectModel(m.name),
      })
    }

    // Rozmowy (po tytule i treści)
    const convs = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)
    for (const c of convs) {
      if (q) {
        const inTitle = match(c.title)
        const inBody = c.messages.some(msg => match(msg.content))
        if (!inTitle && !inBody) continue
      }
      out.push({
        key: 'conv:' + c.id,
        icon: '💬',
        label: c.title,
        sub: `${c.messages.length} wiadomości`,
        run: () => onSelectConversation(c.id),
      })
    }

    return out
  }, [q, models, conversations, current, onNewChat, onOpenPersona, onSelectModel, onSelectConversation])

  useEffect(() => { setSel(0) }, [q])

  const activate = (i: number) => {
    const it = items[i]
    if (it) { it.run(); onClose() }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); activate(sel) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${sel}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', paddingTop: '12vh' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={e => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth: 520,
          background: 'rgba(30,27,55,0.96)', backdropFilter: 'blur(24px)',
          border: '0.5px solid rgba(var(--accent-rgb),0.3)', boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
        }}
      >
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>🔍</span>
          <input
            value={query}
            autoFocus
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Szukaj rozmów, zmień model, wykonaj akcję…"
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          />
          <kbd style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '1px 5px' }}>Esc</kbd>
        </div>

        <div ref={listRef} className="overflow-y-auto p-1.5" style={{ maxHeight: '50vh' }}>
          {items.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'rgba(255,255,255,0.35)' }}>Brak wyników</p>
          )}
          {items.map((it, i) => (
            <button
              key={it.key}
              data-idx={i}
              onMouseEnter={() => setSel(i)}
              onClick={() => activate(i)}
              className="w-full flex items-center gap-2.5 text-left rounded-xl px-3 py-2"
              style={{ background: i === sel ? 'rgba(var(--accent-rgb),0.16)' : 'transparent' }}
            >
              <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{it.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>{it.label}</span>
                {it.sub && <span className="block text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{it.sub}</span>}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
