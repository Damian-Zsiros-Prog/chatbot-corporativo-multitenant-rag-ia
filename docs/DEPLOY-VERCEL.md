# Despliegue en Vercel (desde GitHub)

## 1. Conectar repositorio

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository
2. Selecciona `chatbot-corporativo-multitenant-rag-ia`
3. Framework: **Next.js** (detectado automáticamente)
4. Root Directory: `./`

## 2. Variables de entorno (Production)

| Variable | Valor | Notas |
|----------|-------|-------|
| `AUTH_SECRET` | string aleatorio ≥32 chars | Obligatorio |
| `OLLAMA_BASE_URL` | `http://142.93.112.22:11434` | Ollama remoto (firewall abierto a Vercel) |
| `OLLAMA_MODEL` | `llama3.2` | |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text` | |
| `DATABASE_PATH` | `/tmp/chatbot.db` | SQLite en disco efímero Vercel |
| `STORAGE_PATH` | `/tmp/storage` | Uploads no persisten entre cold starts |
| `RAG_TOP_K` | `5` | |
| `RAG_MIN_SCORE` | `0.65` | |
| `NEXT_PUBLIC_APP_NAME` | `Chatbot Corporativo RAG` | |

La app copia `data/chatbot.seed.db` → `/tmp/chatbot.db` en el primer arranque si no existe.

## 3. Ollama remoto

El droplet DigitalOcean debe permitir el puerto **11434** desde IPs de Vercel (rangos dinámicos) o abrir temporalmente a `0.0.0.0/0` solo para demo académica.

## 4. Limitaciones en Vercel

- SQLite y uploads son **efímeros** (se reinician en cold start)
- Re-indexar documentos requiere Ollama accesible desde Vercel
- Para producción real: PostgreSQL + blob storage (S3) + Ollama/VLLM dedicado

## 5. Deploy manual (CLI)

```bash
pnpm dlx vercel login
pnpm dlx vercel link
pnpm dlx vercel env pull .env.vercel.local
pnpm dlx vercel --prod
```
