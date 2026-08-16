#!/usr/bin/env bash
# ┌─────────────────────────────────────────────────────┐
# │  Czat bez Filtra · czyszczenie logów (Postgres)       │
# │  usuwa wpisy pasujące do wzorca z conversation_logs   │
# └─────────────────────────────────────────────────────┘
# Użycie:
#   ./clean-logs.sh                 # domyślny wzorzec nieprzyzwoitych pytań
#   ./clean-logs.sh 'wzor1|wzor2'   # własny wzorzec (regex Postgresa, pole question)
set -euo pipefail
cd "$(dirname "$0")"

# Wczytaj POSTGRES_USER / POSTGRES_DB z .env (potrzebne do połączenia z kontenerem)
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
PGUSER="${POSTGRES_USER:-aichat}"
PGDB="${POSTGRES_DB:-aichat}"

# Domyślny wzorzec - dopasowanie do pola "question" (case-insensitive, regex Postgresa)
PATTERN="${1:-masturbac|fantazj|dewiacj|analn|tyłk|stringi|piersi|kuzynk|penis|nerk|organ|mięs|samemu sobie|samym sobie|nóż kuchenny|noz kuchenny}"

# ── paleta ───────────────────────────────────────
if [ -t 1 ]; then
  R=$'\033[0m'; B=$'\033[1m'; DIM=$'\033[2m'
  CY=$'\033[38;5;51m'; PU=$'\033[38;5;141m'; GR=$'\033[38;5;120m'; RD=$'\033[38;5;203m'; GY=$'\033[38;5;240m'
else
  R= ; B= ; DIM= ; CY= ; PU= ; GR= ; RD= ; GY=
fi

die() { printf "  ${RD}✗ %s${R}\n" "$1"; exit 1; }

# </dev/null: `docker compose exec -T` domyślnie przejmuje stdin skryptu -
# bez tego zapytania dry-run (przed właściwym `read` niżej) "zjadłyby" wpisane
# potwierdzenie, zanim użytkownik zdążyłby je wysłać.
psql_exec() { docker compose exec -T postgres psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1 "$@" < /dev/null; }

RUNNING=$(docker compose ps postgres --status running -q 2>/dev/null)
[ -n "$RUNNING" ] || die "kontener postgres nie działa - uruchom stack (./redeploy.sh albo docker compose up -d)"

clear 2>/dev/null || true
echo
printf "  ${B}${PU}◆ CZYSZCZENIE LOGÓW${R}  ${GY}// Postgres: conversation_logs${R}\n"
printf "  ${GY}─────────────────────────────────────────────${R}\n"
printf "  ${DIM}wzorzec:${R} ${CY}%s${R}\n\n" "$PATTERN"

# ── dry-run ──────────────────────────────────────
COUNT=$(psql_exec -tAc "SELECT count(*) FROM conversation_logs WHERE question ~* '$PATTERN';")
TOTAL=$(psql_exec -tAc "SELECT count(*) FROM conversation_logs;")

if [ "$COUNT" -gt 0 ]; then
  printf "  ${B}Do usunięcia (%s z %s):${R}\n" "$COUNT" "$TOTAL"
  psql_exec -tAc "SELECT '  • ' || to_char(ts,'YYYY-MM-DD HH24:MI') || '  ' || left(question,80) FROM conversation_logs WHERE question ~* '$PATTERN' ORDER BY ts;"
  echo
else
  printf "  ${GR}Brak pasujących wpisów${R}\n\n"
  exit 0
fi

printf "  ${B}Kontynuować?${R} ${DIM}usunie %s wpisów (backup trafi do logs/) [t/N]${R} " "$COUNT"
read -r ans
[[ "$ans" =~ ^[tTyY]$ ]] || { echo; printf "  ${GY}Anulowano.${R}\n"; exit 0; }

# ── operacja ─────────────────────────────────────
echo
mkdir -p logs
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP="logs/conversation_logs.bak.$STAMP.sql"

printf "  ${CY}▸${R} backup całej tabeli → ${DIM}%s${R}\n" "$BACKUP"
docker compose exec -T postgres pg_dump -U "$PGUSER" -d "$PGDB" -t conversation_logs < /dev/null > "$BACKUP"

printf "  ${CY}▸${R} usuwam %s wpisów…\n" "$COUNT"
psql_exec -c "DELETE FROM conversation_logs WHERE question ~* '$PATTERN';" >/dev/null

NEW=$(psql_exec -tAc "SELECT count(*) FROM conversation_logs;")
printf "  ${GY}─────────────────────────────────────────────${R}\n"
printf "  ${GR}● gotowe${R}   ${DIM}%s → %s wpisów   ·   backup: %s${R}\n\n" "$TOTAL" "$NEW" "$BACKUP"
