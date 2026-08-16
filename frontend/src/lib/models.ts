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
      label: 'Dolphin PL (8B)',
      desc: 'Szybki - odpowiada w kilka sekund. Bez cenzury, bez ograniczeń, po polsku.',
      tags: ['bez cenzury', 'po polsku', 'szybki'],
      greeting: 'Cześć! Dolphin PL - szybki, bez hamulców i zawsze po polsku. Pytaj o cokolwiek.',
      emoji: '🐬',
      accentRgb: PINK,
    },
  },
  {
    match: 'huihui_ai/dolphin3-abliterated',
    meta: {
      label: 'Dolphin 3 Abliterated (8B)',
      desc: 'Najswobodniejszy z dostępnych. Odpowie dosłownie na wszystko, dobrze po polsku.',
      tags: ['bez cenzury', 'po polsku'],
      greeting: 'Cześć! Jestem Dolphin 3 bez żadnych hamulców. Pytaj o naprawdę cokolwiek - nie odmawiam.',
      emoji: '🐬',
      accentRgb: PINK,
    },
  },
  {
    match: 'huihui_ai/qwen2.5-abliterate:14b',
    meta: {
      label: 'Qwen 2.5 Abliterated (14B)',
      desc: 'Najmądrzejszy - lepsze odpowiedzi, głębsza analiza. Wolniejszy, warto poczekać.',
      tags: ['bez cenzury', 'najmądrzejszy', 'wolniejszy'],
      greeting: 'Cześć! Jestem największym i najbystrzejszym modelem tutaj. Rzucaj trudnymi pytaniami - poradzę sobie.',
      emoji: '🧠',
      accentRgb: VIOLET,
    },
  },
  {
    match: 'huihui_ai/qwen2.5-abliterate:3b',
    meta: {
      label: 'Qwen 2.5 Abliterated (3B)',
      desc: 'Malutki i błyskawiczny - testowy, do szybkich pytań. Kosztem trochę słabszych odpowiedzi.',
      tags: ['bez cenzury', 'najszybszy', 'testowy'],
      greeting: 'Cześć! Jestem najmniejszym Qwenem tutaj - błyskawiczny, testuj śmiało.',
      emoji: '⚡',
      accentRgb: VIOLET,
    },
  },
  {
    match: 'huihui_ai/qwen2.5-abliterate',
    meta: {
      label: 'Qwen 2.5 Abliterated (7B)',
      desc: 'Mądrzejszy niż Dolphin PL, a nadal szybki na słabszym sprzęcie. Bez cenzury.',
      tags: ['bez cenzury', 'mądrzejszy', 'szybki'],
      greeting: 'Cześć! Jestem Qwen 2.5 7B - mądrzejszy od Dolphina, a wciąż szybki. Pytaj śmiało.',
      emoji: '🧠',
      accentRgb: VIOLET,
    },
  },
  {
    match: 'huihui_ai/qwen3-abliterated',
    meta: {
      label: 'Qwen 3 Abliterated (8B) - test',
      desc: 'Nowsza generacja Qwena, testowo obok 2.5. Sprawdź, czy wypada lepiej na tym sprzęcie.',
      tags: ['bez cenzury', 'testowy', 'nowa generacja'],
      greeting: 'Cześć! Jestem Qwen 3 - nowsza generacja, testowo na pokładzie.',
      emoji: '🧪',
      accentRgb: VIOLET,
    },
  },
  {
    match: 'dolphin3',
    meta: {
      label: 'Dolphin 3 (8B)',
      desc: 'Swobodny i bez cenzury, dobrze mówi po polsku. Dobry do każdej rozmowy.',
      tags: ['bez cenzury', 'po polsku'],
      greeting: 'Hej! Dolphin 3 na pokładzie. Odpowiem swobodnie na każdy temat.',
      emoji: '🐬',
      accentRgb: PINK,
    },
  },
  {
    match: 'dolphin-mistral',
    meta: {
      label: 'Dolphin Mistral (7B)',
      desc: 'Lżejszy i bez cenzury. Polski słabszy, ale bywa szybszy.',
      tags: ['bez cenzury', 'szybszy'],
      greeting: 'Cześć! Jestem lekki i bez cenzury. Lecimy z pytaniami.',
      emoji: '⚡',
      accentRgb: PINK,
    },
  },
  {
    match: 'speakleash/bielik-4.5b',
    meta: {
      label: 'Bielik 4.5B (PL)',
      desc: 'Lekki polski model - szybki na słabszym CPU, ale bez abliteracji, więc bywa ostrożniejszy.',
      tags: ['po polsku', 'szybki', 'nieocenzurowany częściowo'],
      greeting: 'Cześć! Bielik 4.5B - lżejszy, szybszy, wciąż po polsku.',
      emoji: '🦅',
      accentRgb: AMBER,
    },
  },
  {
    match: 'speakleash/bielik',
    meta: {
      label: 'Bielik 11B (PL)',
      desc: 'Najlepsza polszczyzna i wiedza o Polsce. Oficjalny model, nie abliterowany - bywa ostrożniejszy w tematach.',
      tags: ['po polsku', 'wolniejszy'],
      greeting: 'Dzień dobry! Jestem Bielik - mówię najlepszą polszczyzną ze wszystkich tutaj.',
      emoji: '🦅',
      accentRgb: AMBER,
    },
  },
  {
    match: 'huihui_ai/deepseek-r1-abliterated',
    meta: {
      label: 'DeepSeek R1 Abliterated (8B) - test',
      desc: 'Model rozumujący - najpierw "myśli" na głos (<think>), potem odpowiada. Chiński, bez cenzury, eksperymentalny.',
      tags: ['bez cenzury', 'testowy', 'rozumowanie'],
      greeting: 'Cześć! Jestem DeepSeek R1 - najpierw pomyślę na głos, potem odpowiem. Bez cenzury.',
      emoji: '🐲',
      accentRgb: RED,
    },
  },
  {
    match: 'llama3.1',
    meta: {
      label: 'Llama 3.1 (8B)',
      desc: 'Solidny i rzeczowy, dobry do analiz. Bywa ostrożny w drażliwych tematach.',
      tags: ['rzeczowy'],
      greeting: 'Cześć! Llama 3.1 do usług - konkretnie i na temat.',
      emoji: '🦙',
      accentRgb: ORANGE,
    },
  },
  {
    match: 'llama3',
    meta: {
      label: 'Llama 3',
      desc: 'Starszy, ogólny model. Stabilny, ale słabszy od nowszych.',
      tags: ['ogólny'],
      greeting: 'Hej! Llama 3 słucha. W czym mogę pomóc?',
      emoji: '🦙',
      accentRgb: ORANGE,
    },
  },
  {
    match: 'qwen',
    meta: {
      label: 'Qwen (7B)',
      desc: 'Najlepszy do kodu i matematyki. Po polsku radzi sobie słabiej.',
      tags: ['kod', 'matematyka'],
      greeting: 'Cześć! Najmocniejszy jestem w kodzie i liczbach. Rzuć mi wyzwanie.',
      emoji: '🧮',
      accentRgb: VIOLET,
    },
  },
  {
    match: 'mistral',
    meta: {
      label: 'Mistral (7B)',
      desc: 'Szybki i zwięzły, do prostych zadań. Polski przeciętny.',
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
