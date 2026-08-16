import { motion } from 'framer-motion'

// "System się przestraja" - pełnoekranowy efekt przy zmianie modelu, w duchu
// HUD/sci-fi: pionowy skan świetlny przelatuje przez cały ekran, a narożniki
// błyskają jak celownik namierzający cel. Kolor = aktualny akcent modelu
// (--accent-rgb, patrz ChatWindow/lib/models.ts).
//
// Każdy element ma własny `key={triggerKey}` - React remontuje go od zera przy
// każdej zmianie modelu (nawet między modelami tej samej rodziny/koloru),
// więc feedback "wybór przyjęty" jest zawsze, niezależnie czy kolor faktycznie
// się zmienił. Animacje same kończą się na opacity 0, więc AnimatePresence
// nie jest potrzebne - nie ma czego "wygaszać" przy odmontowaniu.
const CORNER_SIZE = 22
const CORNER_INSET = 14

const CORNERS: { top?: number; bottom?: number; left?: number; right?: number; border: string }[] = [
  { top: CORNER_INSET, left: CORNER_INSET, border: 'borderTop,borderLeft' },
  { top: CORNER_INSET, right: CORNER_INSET, border: 'borderTop,borderRight' },
  { bottom: CORNER_INSET, left: CORNER_INSET, border: 'borderBottom,borderLeft' },
  { bottom: CORNER_INSET, right: CORNER_INSET, border: 'borderBottom,borderRight' },
]

export function ModelSwitchFX({ triggerKey }: { triggerKey: string }) {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Pionowy skan - jasna linia z poświatą przelatuje z góry na dół */}
      <motion.div
        key={triggerKey + '-scan'}
        className="absolute inset-x-0"
        initial={{ top: '-24%', opacity: 0 }}
        animate={{ top: '112%', opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          height: '26%',
          background:
            'linear-gradient(180deg, transparent, rgba(var(--accent-rgb),0.5) 46%, rgba(var(--accent-rgb),0.95) 50%, rgba(var(--accent-rgb),0.5) 54%, transparent)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Narożniki HUD - błysk "namierzono cel", gasną szybciej niż skan */}
      {CORNERS.map((c, i) => {
        const sides = Object.fromEntries(c.border.split(',').map(k => [k, '1.5px solid rgb(var(--accent-rgb))']))
        return (
          <motion.div
            key={triggerKey + '-corner-' + i}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: [0, 1, 0], scale: 1 }}
            transition={{ duration: 0.9, times: [0, 0.3, 1], ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: c.top, bottom: c.bottom, left: c.left, right: c.right,
              width: CORNER_SIZE, height: CORNER_SIZE,
              filter: 'drop-shadow(0 0 5px rgb(var(--accent-rgb)))',
              ...sides,
            }}
          />
        )
      })}
    </div>
  )
}
