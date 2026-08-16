import { useState } from 'react'
import { motion } from 'framer-motion'

interface PersonaPanelProps {
  value: string
  onSave: (text: string) => void
  onClose: () => void
}

const PRESETS = [
  { label: '👨‍💻 Programista', text: 'Jesteś doświadczonym programistą. Odpowiadaj konkretnie, z przykładami kodu i krótkim wyjaśnieniem. Wskazuj pułapki i lepsze rozwiązania.' },
  { label: '✍️ Pisarz', text: 'Jesteś kreatywnym pisarzem. Pisz barwnym, obrazowym językiem, dbaj o styl i rytm zdań.' },
  { label: '🎓 Nauczyciel', text: 'Jesteś cierpliwym nauczycielem. Tłumacz od podstaw, prostymi słowami, krok po kroku, z przykładami z życia.' },
  { label: '🧪 Ekspert', text: 'Jesteś wnikliwym ekspertem. Odpowiadaj szczegółowo i merytorycznie, podawaj niuanse i kontekst.' },
]

export function PersonaPanel({ value, onSave, onClose }: PersonaPanelProps) {
  const [text, setText] = useState(value)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={e => e.stopPropagation()}
        className="w-full rounded-2xl p-5"
        style={{
          maxWidth: 480,
          background: 'rgba(30,27,55,0.95)', backdropFilter: 'blur(24px)',
          border: '0.5px solid rgba(var(--accent-rgb),0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: 18 }}>🎭</span>
          <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>Persona rozmowy</h2>
        </div>
        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Dodatkowe instrukcje, jak model ma się zachowywać w <strong style={{color:'rgba(var(--accent-rgb),0.9)'}}>tej</strong> rozmowie.
          Dotyczy tylko jej. Zostaw puste, by wrócić do domyślnego zachowania.
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => setText(p.text)}
              className="text-xs rounded-full px-2.5 py-1 transition-colors"
              style={{ background: 'rgba(96,165,250,0.12)', border: '0.5px solid rgba(96,165,250,0.25)', color: 'rgba(147,197,253,0.95)' }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
          rows={5}
          placeholder="Np. Jesteś sarkastycznym ekspertem od historii, który odpowiada zwięźle i z humorem…"
          className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none"
          style={{
            background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.92)', lineHeight: '1.5', fontFamily: 'inherit',
          }}
        />

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setText('')}
            className="text-xs px-2 py-1"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Wyczyść
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Anuluj
            </button>
            <button
              onClick={() => onSave(text)}
              className="text-sm px-4 py-1.5 rounded-lg font-medium"
              style={{ background: 'linear-gradient(135deg,rgb(var(--accent-rgb)),rgba(var(--accent-rgb),0.55))', color: '#fff' }}
            >
              Zapisz
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
