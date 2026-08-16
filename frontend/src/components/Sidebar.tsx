import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useState } from 'react'
import { dateGroup, type Conversation } from '@/lib/conversations'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onLogout: () => void
}

export function Sidebar({ isOpen, onClose, conversations, activeId, onSelect, onNew, onDelete, onRename, onLogout }: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  // Sortuj malejąco po aktywności i pogrupuj po dacie
  const groups = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)
    const out: { label: string; items: Conversation[] }[] = []
    for (const c of sorted) {
      const label = dateGroup(c.updatedAt)
      let g = out.find(x => x.label === label)
      if (!g) { g = { label, items: [] }; out.push(g) }
      g.items.push(c)
    }
    return out
  }, [conversations])

  const commitRename = () => {
    if (editingId) {
      const t = draft.trim()
      if (t) onRename(editingId, t)
    }
    setEditingId(null)
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-20 md:hidden"
            style={{background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)'}}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full z-30 flex flex-col md:relative md:translate-x-0"
        style={{
          width: 220,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          borderRight: '0.5px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{padding:'16px 14px 12px',borderBottom:'0.5px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex items-center justify-center"
              style={{width:22,height:22,borderRadius:7,background:'linear-gradient(135deg,#a78bfa,#60a5fa)'}}
            >
              <div style={{width:7,height:7,borderRadius:2.5,background:'#0f0c29'}} />
            </div>
            <span className="text-sm tracking-tight">
              <span style={{color:'rgba(255,255,255,0.92)',fontWeight:600}}>Bez</span>
              <span style={{color:'rgba(167,139,250,0.95)',fontWeight:600}}> Filtra</span>
            </span>
          </div>
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 text-xs rounded-lg px-3 py-2 transition-colors"
            style={{background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)'}}
          >
            + Nowa rozmowa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          {conversations.length === 0 && (
            <p className="text-xs text-center mt-4" style={{color:'rgba(255,255,255,0.25)'}}>Brak rozmów</p>
          )}
          {groups.map(group => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <p className="px-2 pt-1 pb-0.5" style={{fontSize:10,letterSpacing:'0.04em',color:'rgba(255,255,255,0.3)',textTransform:'uppercase'}}>
                {group.label}
              </p>
              {group.items.map(c => {
                const active = activeId === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => { if (editingId !== c.id) onSelect(c.id) }}
                    className="group w-full flex items-center gap-1 px-3 py-2.5 rounded-lg transition-colors cursor-pointer"
                    style={{
                      background: active ? 'rgba(var(--accent-rgb),0.15)' : 'transparent',
                      border: active ? '0.5px solid rgba(var(--accent-rgb),0.25)' : '0.5px solid transparent',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      {editingId === c.id ? (
                        <input
                          value={draft}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                          onChange={e => setDraft(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitRename()
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="w-full bg-transparent border-none outline-none text-xs"
                          style={{color:'rgba(255,255,255,0.95)',borderBottom:'0.5px solid rgba(var(--accent-rgb),0.5)'}}
                        />
                      ) : (
                        <p className="text-xs truncate" style={{color:'rgba(255,255,255,0.75)'}}>{c.title}</p>
                      )}
                    </div>
                    {editingId !== c.id && (
                      <div className="hover-actions flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setEditingId(c.id); setDraft(c.title) }}
                          aria-label="Zmień nazwę"
                          className="flex items-center justify-center rounded-md"
                          style={{width:20,height:20,color:'rgba(255,255,255,0.4)'}}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); onDelete(c.id) }}
                          aria-label="Usuń rozmowę"
                          className="flex items-center justify-center rounded-md"
                          style={{width:20,height:20,color:'rgba(255,255,255,0.4)'}}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div style={{padding:'10px 8px',borderTop:'0.5px solid rgba(255,255,255,0.06)'}}>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors"
            style={{color:'rgba(255,255,255,0.4)',border:'0.5px solid rgba(255,255,255,0.08)'}}
          >
            ← Wyloguj
          </button>
          <div className="flex flex-col items-center gap-0.5 mt-3 mb-1">
            <div className="flex items-center gap-1" style={{fontSize:11}}>
              <span style={{color:'rgba(255,255,255,0.35)'}}>crafted by</span>
              <span
                style={{
                  fontWeight:700,letterSpacing:'-0.01em',
                  background:'linear-gradient(135deg,#a78bfa,#60a5fa)',
                  WebkitBackgroundClip:'text',backgroundClip:'text',WebkitTextFillColor:'transparent',
                }}
              >
                NullPointer Studio
              </span>
            </div>
            <span style={{fontSize:9,color:'rgba(255,255,255,0.22)',letterSpacing:'0.04em'}}>
              null safe, fully unchained
            </span>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
