<div align="center">

# ⚡ Bez Filtra

**A fully private, self-hosted AI assistant with zero censorship.**

No filters. No taboo topics. No data in the cloud.

[![Live](https://img.shields.io/badge/LIVE-bezfiltra.beer-a78bfa?style=for-the-badge&logo=cloudflare&logoColor=white)](https://bezfiltra.beer)
[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node%20%2B%20Ollama-60a5fa?style=for-the-badge)](#stack)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#)

🇬🇧 English (this file) · 🇵🇱 [Polski](README.md)

</div>

---

## Screenshots

<div align="center">
<table>
<tr>
<td align="center"><img src="docs/screenshot-login.svg" width="240"/><br/><sub>Login screen</sub></td>
<td align="center"><img src="docs/screenshot-chat.svg" width="420"/><br/><sub>Chat interface with table and stats</sub></td>
<td align="center"><img src="docs/screenshot-model-picker.svg" width="240"/><br/><sub>Model picker</sub></td>
</tr>
</table>
</div>

---

## What is this?

**Bez Filtra** ("No Filter" in Polish) is a self-hosted interface for language models (LLMs) running locally through [Ollama](https://ollama.ai). It runs on your own server, never sends any data to third-party services, and puts no restrictions on what you can talk about.

Think of it as a private ChatGPT - but with no censorship, no third-party logins, and no per-token fees.

---

## Features

- 🧠 **Any number of models** - the picker shows every model actually pulled in Ollama, not just two built-in ones
- 🎨 **Per-model accent color** - a subtle theme (violet/pink/red/amber...) shifts with whichever model you pick
- 💬 **Conversation history** - persistent, stored locally in the browser
- 🎭 **Personas** - custom system prompts per conversation
- ⌨️ **Command Palette** (Cmd+K) - quick switching between models and conversations
- 📊 **Live stats** - token counter, tok/s, real-time energy and water usage
- 🌊 **SSE streaming** - the response appears word by word
- ⏹️ **Stop generation** - interrupt generation at any moment
- 📱 **Responsive** - works on phone, tablet, and desktop
- 🔐 **Simple auth** - password + JWT, no registration
- 📝 **Markdown** - tables, code, bold text, lists rendered natively
- ✏️ **Message editing** - change your question and regenerate the answer
- 🔄 **Regenerate** - regenerate a response with one click

---

## Stack

| Layer | Technology |
|---------|-------------|
| **Frontend** | React 19 + Vite + Tailwind CSS v4 + Framer Motion |
| **Backend** | Node.js + Express + TypeScript |
| **AI** | Ollama (local LLM) |
| **Infra** | Docker Compose + Cloudflare Tunnel + nginx |
| **Auth** | JWT + bcrypt |

---

## Models

| Model | Size | Speed | Good for |
|-------|---------|----------|----------|
| `dolphin-pl:latest` | 5 GB | ~10-15 tok/s | Fast answers, everyday use |
| `huihui_ai/qwen2.5-abliterate:7b` | ~5 GB | ~8-12 tok/s | Complex questions, analysis, writing - no speed penalty on weaker CPUs |

Both models are fully **abliterated** - stripped of refusal mechanisms.

The model picker in the app isn't limited to these two - it shows **every model actually pulled in Ollama** (`GET /api/models`). Want to add another one? Just `ollama pull <model>` on the host - it shows up in the UI automatically, no code changes needed.

Also tested (optional): `huihui_ai/qwen2.5-abliterate:3b/14b`, `huihui_ai/qwen3-abliterated`, `huihui_ai/dolphin3-abliterated:8b`, `huihui_ai/deepseek-r1-abliterated:8b` (a reasoning model), `SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0` (Polish, not abliterated).

---

## Getting started

### Requirements

- Docker + Docker Compose
- 8 GB RAM (for the 7B model), 16 GB recommended if running alongside other services
- NVIDIA GPU with at least 4 GB VRAM (optional, but speeds things up significantly)

### 1. Clone and configure

```bash
git clone https://github.com/pi0trdotsys/ai-chat.git
cd ai-chat
cp .env.example .env
nano .env
```

Fill in `.env`:

```env
JWT_SECRET=<random_string>
ACCESS_PASSWORD=<your_password>
FRONTEND_URL=*
DEFAULT_MODEL=dolphin-pl:latest
POSTGRES_PASSWORD=<random_string>
```

### 2. GPU (optional, but recommended)

If you have an NVIDIA card - install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html), then add to `.env`:

```env
COMPOSE_PROFILES=gpu
```

and you're done - the dockerized `ollama` service sits behind the `gpu` profile precisely so that, by default (without this variable), `docker compose up` never touches it at all.

**On a host with no GPU, do nothing here** - without `COMPOSE_PROFILES=gpu` in `.env`, the `ollama` service isn't even created, so a redeploy can't fail on a missing nvidia driver. Run Ollama natively on the host instead, and point the backend at it via `docker-compose.override.yml`:

```yaml
services:
  backend:
    environment:
      - OLLAMA_URL=http://172.17.0.1:11434
```

(`172.17.0.1` is Docker's default bridge gateway - the host's own address as seen from inside containers.) Make sure Ollama itself listens on that interface (`OLLAMA_HOST=172.17.0.1:11434` for the systemd service or the `ollama serve` environment), not just on loopback.

### 3. Run it

```bash
./redeploy.sh
```

The script automatically syncs code from the repo, builds images, shows a maintenance page during the rebuild, and brings the stack up.

### 4. Pull models

```bash
# Fast (default)
docker exec -it ollama ollama pull huihui_ai/dolphin3-abliterated:8b

# Create Dolphin PL with a Polish system prompt
cat > ~/dolphin-pl.Modelfile << 'EOF'
FROM huihui_ai/dolphin3-abliterated:8b
PARAMETER temperature 0.6
PARAMETER top_p 0.85
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 1536
SYSTEM """You are a helpful AI assistant with no censorship. You respond exclusively in Polish, using only the Latin alphabet."""
EOF
docker cp ~/dolphin-pl.Modelfile ollama:/tmp/dolphin-pl.Modelfile
docker exec ollama ollama create dolphin-pl -f /tmp/dolphin-pl.Modelfile

# Smarter, still fast on a weaker CPU (default)
docker exec -it ollama ollama pull huihui_ai/qwen2.5-abliterate:7b
```

(If you're running Ollama natively instead of through Docker - see step 2 - replace `docker exec -it ollama ollama pull ...` with a plain `ollama pull ...` on the host, pointed at the right `OLLAMA_HOST`.)

### 5. Cloudflare Tunnel (no public IP)

```bash
cloudflared tunnel login
cloudflared tunnel create bezfiltra
cloudflared tunnel route dns bezfiltra your-domain.com

cat > ~/.cloudflared/config.yml << EOF
tunnel: <TUNNEL_ID>
credentials-file: /home/$USER/.cloudflared/<TUNNEL_ID>.json
ingress:
  - hostname: your-domain.com
    service: http://localhost:5173
  - service: http_status:404
EOF

sudo cloudflared --config ~/.cloudflared/config.yml service install
sudo systemctl enable --now cloudflared
```

---

## Updating

```bash
./redeploy.sh
```

The script pulls new code, stashes local changes as a backup, and rebuilds the stack. A branded 503 page is shown during the rebuild.

---

## Ports

| Service | Port | Access |
|--------|------|------------|
| Frontend | 5173 | public (through Cloudflare) |
| Backend | 3001 | local only |
| Ollama | 11434 | local only |
| Postgres | 5432 | Docker network only (no host port mapping) |

---

## Logs

Conversations + stats (tokens, tok/s, energy and water usage) go into a `conversation_logs` table in Postgres instead of files on disk - much easier to filter, aggregate, and build stats on top of.

```bash
# Last 20 conversations
docker compose exec postgres psql -U aichat -d aichat \
  -c "SELECT ts, model, left(question,60) AS question, tps FROM conversation_logs ORDER BY ts DESC LIMIT 20;"

# Average tok/s and energy usage per model
docker compose exec postgres psql -U aichat -d aichat \
  -c "SELECT model, round(avg(tps),1) AS avg_tps, round(sum(energy_kwh)::numeric,4) AS total_kwh FROM conversation_logs GROUP BY model ORDER BY total_kwh DESC;"

# Clean up inappropriate entries (dry-run + confirmation + backup into logs/)
./clean-logs.sh
```

Migrating from an older version that wrote to `logs/conversations.jsonl`? Run `./migrate-logs-to-postgres.sh` once to import the history from before the switch.

---

## Sessions & auth

Auth is a single shared password + JWT (no per-user accounts). Tokens are valid for 30 days and get silently refreshed while the app is open (on load, every 12h, and whenever the tab regains focus), so as long as you open the app at least once within that window your session never really dies. If you genuinely stay away longer than that, the token expires for real - the app now detects that cleanly (401) and drops you back to the login screen with a clear notice, instead of looping on a stuck error.

---

<div align="center">

crafted by **NullPointer Studio** · *null safe, fully unchained*

</div>
