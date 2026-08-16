#!/usr/bin/env bash
# ┌─────────────────────────────────────────────────────┐
# │  Czat bez Filtra · jednorazowa migracja logów         │
# │  logs/conversations.jsonl  ->  Postgres               │
# └─────────────────────────────────────────────────────┘
# Uruchom RAZ, po przejściu na logowanie w Postgresie (patrz README, sekcja
# "Logi"), żeby nie stracić historii sprzed migracji. Bezpieczne odpalić
# wielokrotnie na tym samym pliku - kolejne uruchomienie po prostu doda
# duplikaty, więc rób to raz i sprawdź licznik na końcu.
set -euo pipefail
cd "$(dirname "$0")"

JSONL="logs/conversations.jsonl"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
PGUSER="${POSTGRES_USER:-aichat}"
PGDB="${POSTGRES_DB:-aichat}"

if [ -t 1 ]; then
  R=$'\033[0m'; B=$'\033[1m'; DIM=$'\033[2m'
  CY=$'\033[38;5;51m'; PU=$'\033[38;5;141m'; GR=$'\033[38;5;120m'; RD=$'\033[38;5;203m'; GY=$'\033[38;5;240m'
else
  R= ; B= ; DIM= ; CY= ; PU= ; GR= ; RD= ; GY=
fi

die() { printf "  ${RD}✗ %s${R}\n" "$1"; exit 1; }

command -v jq >/dev/null || die "brak jq - zainstaluj: sudo apt install jq"
[ -f "$JSONL" ] || die "nie znaleziono $JSONL - nic do migracji"

RUNNING=$(docker compose ps postgres --status running -q 2>/dev/null)
[ -n "$RUNNING" ] || die "kontener postgres nie działa - uruchom stack (./redeploy.sh albo docker compose up -d)"

TOTAL=$(wc -l < "$JSONL" | tr -d ' ')

clear 2>/dev/null || true
echo
printf "  ${B}${PU}◆ MIGRACJA LOGÓW DO POSTGRESA${R}  ${GY}// %s${R}\n" "$JSONL"
printf "  ${GY}─────────────────────────────────────────────${R}\n"
printf "  ${DIM}wierszy do zaimportowania:${R} ${CY}%s${R}\n\n" "$TOTAL"

printf "  ${B}Kontynuować?${R} ${DIM}dopisze %s wierszy do conversation_logs [t/N]${R} " "$TOTAL"
read -r ans
[[ "$ans" =~ ^[tTyY]$ ]] || { echo; printf "  ${GY}Anulowano.${R}\n"; exit 0; }

echo
printf "  ${CY}▸${R} konwertuję JSONL -> CSV…\n"
CSV="/tmp/migrate-logs.$$.csv"
# WAŻNE: brakujące pola muszą zostać prawdziwym JSON-owym null, nie "" -
# @csv renderuje null jako gołe puste pole (dopasowuje się do NULL ''
# poniżej), a "" jako pole w cudzysłowie (Postgres bierze to dosłownie jako
# pusty string, nie NULL - integer nie przyjmie pustego stringa i COPY padnie).
# Drugie WAŻNE: wall_ms/load_ms/prompt_ms w schemacie to INTEGER, a w JSONL
# loadMs/promptMs to nanosekundy/1e6 - prawie nigdy nie wychodzi liczba
# całkowita (np. 8487.52356) - stąd `rnd` (zaokrąglenie, z zachowaniem null).
jq -r '
  def rnd: if . == null then null else round end;
  [
    .ts, .ip, .model, .question, .answer, .error,
    (.stats.wallMs | rnd), (.stats.loadMs | rnd), .stats.promptTok,
    (.stats.promptMs | rnd), .stats.genTok, .stats.genSec, .stats.tps,
    .footprint.energyKWh, .footprint.waterL, .footprint.powerWatts,
    .summary
  ] | @csv
' "$JSONL" > "$CSV"

printf "  ${CY}▸${R} importuję do conversation_logs…\n"
BEFORE=$(docker compose exec -T postgres psql -U "$PGUSER" -d "$PGDB" -tAc "SELECT count(*) FROM conversation_logs;")
{
  echo "COPY conversation_logs (ts, ip, model, question, answer, error, wall_ms, load_ms, prompt_tok, prompt_ms, gen_tok, gen_sec, tps, energy_kwh, water_l, power_watts, summary) FROM STDIN WITH (FORMAT csv, NULL '');"
  cat "$CSV"
  echo '\.'
} | docker compose exec -T postgres psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1
rm -f "$CSV"

AFTER=$(docker compose exec -T postgres psql -U "$PGUSER" -d "$PGDB" -tAc "SELECT count(*) FROM conversation_logs;")
printf "  ${GY}─────────────────────────────────────────────${R}\n"
printf "  ${GR}● gotowe${R}   ${DIM}conversation_logs: %s -> %s wierszy${R}\n\n" "$BEFORE" "$AFTER"
