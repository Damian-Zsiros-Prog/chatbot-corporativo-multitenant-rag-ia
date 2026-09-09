# Chatbot Corporativo Multi-tenant RAG

Prototipo académico para consulta de reglamentos y políticas empresariales con IA generativa y RAG. Empresas simuladas de Cartagena.

## Documentación

- [SDD — Diseño de software](./docs/SDD.md)
- [Matriz de requerimientos](./docs/REQUIREMENTS.md)
- [Design system](./docs/DESIGN.md)

## Requisitos

- Node.js 20+
- pnpm 9+
- [Ollama](https://ollama.com) nativo en Windows (`winget install Ollama.Ollama`)
- **SQLite** incluido — no requiere Docker ni PostgreSQL

## Inicio rápido

```bash
# 1. Ollama (IA local)
winget install Ollama.Ollama --accept-package-agreements --accept-source-agreements
ollama pull llama3.2
ollama pull nomic-embed-text

# 2. App + base de datos SQLite
cp .env.example .env.local
pnpm install
pnpm db:push
pnpm db:seed
pnpm ingest
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000)

Verifica Ollama: [http://localhost:3000/api/ollama/health](http://localhost:3000/api/ollama/health)

### Alternativa con Docker

Ver [docs/DOCKER-SETUP.md](./docs/DOCKER-SETUP.md) (opcional; ya no es necesario).

## Usuarios demo

Contraseña para todos: `demo123`

| Empresa | Email | Rol |
|---------|-------|-----|
| Logística Caribe | empleado@logistica.demo | empleado |
| Logística Caribe | rh@logistica.demo | rh |
| Hotel Bahía Dorada | empleado@hotel.demo | empleado |
| Hotel Bahía Dorada | rh@hotel.demo | rh |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm db:push` | Crea/actualiza SQLite en `./data/chatbot.db` |
| `pnpm db:seed` | Carga empresas, usuarios y documentos |
| `pnpm ingest` | Indexa documentos (chunks + embeddings Ollama) |
| `pnpm evaluate` | Ejecuta 40 preguntas y genera informe en `docs/results/` |
| `pnpm db:studio` | UI de Drizzle para inspeccionar datos |
| `pnpm ollama:pull` | Descarga modelos LLM y embeddings |
| `pnpm dev` | Servidor de desarrollo Next.js |

## Estado del proyecto

- [x] Fase 0 — Infra, design tokens, estructura
- [x] Fase 1 — Schema, seed, documentos simulados, login
- [x] Fase 2 — Ingestion pipeline (chunking + embeddings)
- [x] Fase 3 — RAG Core + chat API
- [x] Fase 4 — RBAC en retrieval
- [x] Fase 5 — UI chat con citas e inspector
- [x] Fase 7 — Evaluación automática (40 preguntas)

## Documentos simulados

Ubicados en `storage/seed/`:

- **Logística Caribe:** reglamento, SST, manual bodega, política RH
- **Hotel Bahía Dorada:** código conducta, vestimenta, check-in, política huéspedes RH
