// Kuratorskie opisy modeli - krótko, prosto, do czego się nadaje.
// Dopasowanie po prefiksie nazwy (np. "llama3.1:8b" -> "llama3.1").
import { notifyUnauthorized } from './session'

export interface ModelMeta {
  label: string
  desc: string
  tags: string[]
  greeting: string
  emoji: string
  // "R,G,B" - używane jako rgba(var(--accent-rgb), alpha) w całym UI,
  // żeby subtelny akcent koloru zmieniał się razem z wybranym modelem.
  accentRgb: string
}

interface ModelRule {
  match: string
  meta: ModelMeta
}

// Kolory rodzin modeli (Tailwind *-400, jasność dobrana pod ciemne tło):
const VIOLET = '167,139,250'  // Qwen (domyślny/marka)
const PINK = '244,114,182'    // Dolphin
const RED = '248,113,113'     // DeepSeek
const AMBER = '251,191,36'    // Bielik
const ORANGE = '251,146,60'   // Llama
const SKY = '56,189,248'      // Mistral

const RULES: ModelRule[] = [
  {
    match: 'dolphin-pl',
    meta: {
      label: 'Dolphin PL',
      desc: 'Szybki i zawsze po polsku - odpowiada w kilka sekund. Idealny do codziennych rozmów.',
      tags: ['po polsku', 'szybki', 'bez cenzury'],
      greeting: 'Cześć! Jestem szybki i zawsze mówię po polsku. Pytaj o cokolwiek.',
      emoji: '🐬',
      accentRgb: PINK,
    },
  },
  {
    match: 'huihui_ai/dolphin3-abliterated',
    meta: {
      label: 'Dolphin 3',
      desc: 'Rozmowny i swobodny, dobrze radzi sobie po polsku. Dobry wybór na każdy temat.',
      tags: ['po polsku', 'bez cenzury'],
      greeting: 'Cześć! Odpowiem swobodnie na naprawdę każde pytanie. Pytaj śmiało.',
      emoji: '🐬',
      accentRgb: PINK,
    },
  },
  {
    match: 'huihui_ai/qwen2.5-abliterate:14b',
    meta: {
      label: 'Qwen 2.5 (14B)',
      desc: 'Najbystrzejszy z dostępnych. Najlepszy do trudnych pytań, analizy i dłuższych tekstów - odpowiada nieco wolniej.',
      tags: ['najmądrzejszy', 'bez cenzury'],
      greeting: 'Cześć! Jestem najbystrzejszym modelem tutaj. Rzucaj trudnymi pytaniami - poradzę sobie.',
      emoji: '🧠',
      accentRgb: VIOLET,
    },
  },
  {
    match: 'huihui_ai/qwen2.5-abliterate:3b',
    meta: {
      label: 'Qwen 2.5 (3B)',
      desc: 'Błyskawiczny - odpowiada niemal natychmiast. Najlepszy do prostych, szybkich pytań.',
      tags: ['najszybszy', 'bez cenzury'],
      greeting: 'Cześć! Jestem błyskawiczny - odpowiadam od ręki. Pytaj śmiało.',
      emoji: '⚡',
      accentRgb: VIOLET,
    },
  },
  {
    match: 'huihui_ai/qwen2.5-abliterate',
    meta: {
      label: 'Qwen 2.5 (7B)',
      desc: 'Złoty środek - bystry i wciąż szybki. Świetny do większości pytań i rozmów.',
      tags: ['polecany', 'bez cenzury'],
      greeting: 'Cześć! Jestem dobrze zbalansowany - bystry, a przy tym szybki. Pytaj o cokolwiek.',
      emoji: '🧠',
      accentRgb: VIOLET,
    },
  },
  {
    match: 'huihui_ai/qwen3-abliterated',
    meta: {
      label: 'Qwen 3',
      desc: 'Najnowsza generacja - bystre, naturalne odpowiedzi na każdy temat.',
      tags: ['nowość', 'bez cenzury'],
      greeting: 'Cześć! Jestem najnowszą generacją Qwena. Pytaj o cokolwiek.',
      emoji: '✨',
      accentRgb: VIOLET,
    },
  },
  {
    match: 'dolphin3',
    meta: {
      label: 'Dolphin 3',
      desc: 'Swobodny i bezpośredni, dobrze mówi po polsku. Dobry do każdej rozmowy.',
      tags: ['po polsku', 'bez cenzury'],
      greeting: 'Hej! Odpowiem swobodnie na każdy temat. Zaczynajmy.',
      emoji: '🐬',
      accentRgb: PINK,
    },
  },
  {
    match: 'dolphin-mistral',
    meta: {
      label: 'Dolphin Mistral',
      desc: 'Lekki i szybki. Najlepiej radzi sobie po angielsku.',
      tags: ['szybki', 'bez cenzury'],
      greeting: 'Cześć! Jestem lekki i szybki. Lecimy z pytaniami.',
      emoji: '⚡',
      accentRgb: PINK,
    },
  },
  {
    match: 'speakleash/bielik-4.5b',
    meta: {
      label: 'Bielik 4.5B',
      desc: 'Polski model - lekki i szybki, ze świetną znajomością polskiego.',
      tags: ['po polsku', 'szybki'],
      greeting: 'Cześć! Jestem polskim modelem - lekkim i szybkim. Pytaj po polsku.',
      emoji: '🦅',
      accentRgb: AMBER,
    },
  },
  {
    match: 'speakleash/bielik',
    meta: {
      label: 'Bielik 11B',
      desc: 'Najlepsza polszczyzna i wiedza o Polsce - model rodzimej produkcji.',
      tags: ['po polsku'],
      greeting: 'Dzień dobry! Mówię najlepszą polszczyzną ze wszystkich tutaj.',
      emoji: '🦅',
      accentRgb: AMBER,
    },
  },
  {
    match: 'huihui_ai/deepseek-r1-abliterated',
    meta: {
      label: 'DeepSeek R1',
      desc: 'Rozważa problem krok po kroku, zanim odpowie. Dobry do zagadek, logiki i matematyki.',
      tags: ['rozumowanie', 'bez cenzury'],
      greeting: 'Cześć! Zanim odpowiem, przemyślę problem krok po kroku. Rzuć mi coś trudnego.',
      emoji: '🐲',
      accentRgb: RED,
    },
  },
  {
    match: 'llama3.1',
    meta: {
      label: 'Llama 3.1',
      desc: 'Solidny i rzeczowy - dobry do analiz i konkretów.',
      tags: ['rzeczowy'],
      greeting: 'Cześć! Jestem konkretny i na temat. W czym pomóc?',
      emoji: '🦙',
      accentRgb: ORANGE,
    },
  },
  {
    match: 'llama3',
    meta: {
      label: 'Llama 3',
      desc: 'Uniwersalny model do ogólnych rozmów.',
      tags: ['ogólny'],
      greeting: 'Hej! Jestem do ogólnych rozmów. W czym mogę pomóc?',
      emoji: '🦙',
      accentRgb: ORANGE,
    },
  },
  {
    match: 'qwen',
    meta: {
      label: 'Qwen',
      desc: 'Mistrz kodu i matematyki. Po polsku radzi sobie słabiej.',
      tags: ['kod', 'matematyka'],
      greeting: 'Cześć! Najmocniejszy jestem w kodzie i liczbach. Rzuć mi wyzwanie.',
      emoji: '🧮',
      accentRgb: VIOLET,
    },
  },
  {
    match: 'mistral',
    meta: {
      label: 'Mistral',
      desc: 'Szybki i zwięzły - do prostych zadań.',
      tags: ['szybki'],
      greeting: 'Hej! Szybko i na temat - o co chodzi?',
      emoji: '💨',
      accentRgb: SKY,
    },
  },
]

const FALLBACK_META: ModelMeta = {
  label: '', desc: 'Model lokalny.', tags: [], greeting: 'Cześć! Gotowy do rozmowy.', emoji: '🤖', accentRgb: VIOLET,
}

export function describeModel(name: string): ModelMeta {
  const rule = RULES.find(r => name.toLowerCase().startsWith(r.match.toLowerCase()))
  if (rule) return rule.meta
  return { ...FALLBACK_META, label: name }
}

export interface ModelEntry {
  name: string
  sizeMB: number
}

export async function fetchModels(): Promise<{ models: ModelEntry[]; default: string }> {
  const res = await fetch('/api/models', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  })
  if (res.status === 401) {
    notifyUnauthorized()
    throw new Error('Sesja wygasła - zaloguj się ponownie')
  }
  if (!res.ok) throw new Error('Nie udało się pobrać listy modeli')
  return res.json()
}
