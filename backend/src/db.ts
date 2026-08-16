import { Pool } from 'pg'

// Jedno źródło prawdy dla rozmów + statystyk - wcześniej JSONL na dysku,
// teraz Postgres (łatwiej filtrować, agregować, robić staty per model/dzień).
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

pool.on('error', err => {
  console.log(`[${new Date().toISOString()}] ✗ Postgres: błąd puli połączeń: ${err.message}`)
})

// Pełny zestaw metryk pojedynczej odpowiedzi - to samo, co dziś trafia do
// klienta jako `stats` w SSE i do buildSummary() w index.ts.
export interface ChatStats {
  wallMs: number
  loadMs: number
  promptTok: number
  promptMs: number
  genTok: number
  genSec: number
  tps: number
}

export interface ConvoRecord {
  ts: string
  ip?: string
  model: string
  question: string
  answer: string
  stats?: ChatStats
  footprint?: { responseTimeMs: number; energyKWh: number; waterL: number; powerWatts: number }
  summary?: string
  error?: string
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS conversation_logs (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    ip TEXT,
    model TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL DEFAULT '',
    error TEXT,
    wall_ms INTEGER,
    load_ms INTEGER,
    prompt_tok INTEGER,
    prompt_ms INTEGER,
    gen_tok INTEGER,
    gen_sec NUMERIC(10,3),
    tps NUMERIC(10,2),
    energy_kwh NUMERIC(14,8),
    water_l NUMERIC(14,8),
    power_watts INTEGER,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS conversation_logs_ts_idx ON conversation_logs (ts DESC);
  CREATE INDEX IF NOT EXISTS conversation_logs_model_idx ON conversation_logs (model);
`

// Postgres w Dockerze bywa jeszcze niegotowy, gdy backend startuje
// (depends_on pilnuje tylko utworzenia kontenera, nie gotowości do przyjmowania
// połączeń) - próbujemy kilka razy z odczekaniem, zanim się poddamy.
export async function initDb(retries = 10, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(CREATE_TABLE_SQL)
      console.log(`[${new Date().toISOString()}] ✓ Postgres: tabela conversation_logs gotowa`)
      return
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`[${new Date().toISOString()}] ✗ Postgres niedostępny (próba ${attempt}/${retries}): ${msg}`)
      if (attempt === retries) throw err
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
}

// Best-effort: błąd zapisu loguje się, ale nigdy nie wywraca odpowiedzi czatu -
// logowanie jest telemetrią, nie krytyczną ścieżką dla użytkownika.
export async function logConversation(record: ConvoRecord): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO conversation_logs
        (ts, ip, model, question, answer, error,
         wall_ms, load_ms, prompt_tok, prompt_ms, gen_tok, gen_sec, tps,
         energy_kwh, water_l, power_watts, summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        record.ts,
        record.ip ?? null,
        record.model,
        record.question,
        record.answer,
        record.error ?? null,
        record.stats?.wallMs ?? null,
        record.stats?.loadMs ?? null,
        record.stats?.promptTok ?? null,
        record.stats?.promptMs ?? null,
        record.stats?.genTok ?? null,
        record.stats?.genSec ?? null,
        record.stats?.tps ?? null,
        record.footprint?.energyKWh ?? null,
        record.footprint?.waterL ?? null,
        record.footprint?.powerWatts ?? null,
        record.summary ?? null,
      ]
    )
  } catch (err) {
    console.log(`[${new Date().toISOString()}] ✗ Nie udało się zapisać rozmowy do Postgresa: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export { pool }
