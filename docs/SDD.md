# SDD — Chatbot Corporativo Multi-tenant RAG (Cartagena)

> **Software Design Document** para el prototipo descrito en el documento de grado *Desarrollo de un chatbot corporativo basado en IA generativa y RAG para la consulta de reglamentos y políticas institucionales en empresas de Cartagena*.
>
> Design system: **Enterprise RAG Intelligence** (`docs/DESIGN.md`).

---

## 1. Visión y alcance

### 1.1 Problema
Los trabajadores de empresas en Cartagena tienen dificultad para localizar y verificar información específica en reglamentos, políticas y procedimientos internos distribuidos en múltiples documentos.

### 1.2 Solución propuesta
Un chatbot corporativo **multi-tenant** con arquitectura **RAG** que:
- Responde **solo** con base en documentación autorizada de cada empresa.
- Respeta **roles de usuario** (acceso contextualizado).
- Muestra **fuentes verificables** (citas con fragmento, documento y score).
- Rechaza preguntas **fuera de alcance** o sin respaldo documental.
- Mantiene **aislamiento** entre 2 empresas simuladas.

### 1.3 Fuera de alcance (v1)
- Empresas reales con datos confidenciales.
- Responder preguntas generales, generar código o ejecutar tareas.
- Reemplazar la lectura oficial del reglamento ni tomar decisiones legales.

### 1.4 Criterios de éxito (metodología del documento)
| Métrica | Objetivo v1 |
|---------|-------------|
| Respuestas correctas | ≥ 80% sobre 40 preguntas de prueba |
| Respuestas con fuente | 100% cuando hay información |
| Rechazo fuera de alcance | ≥ 90% precisión |
| Tiempo de respuesta p95 | < 15 s en local con Ollama |

---

## 2. Trazabilidad de requerimientos

Ver matriz completa en [`docs/REQUIREMENTS.md`](./REQUIREMENTS.md).

| ID | Requerimiento (resumen) | Módulo | Fase |
|----|-------------------------|--------|------|
| RF-01 | Autenticación y sesión por usuario | Auth | 4 |
| RF-02 | Multi-tenant: 2 empresas aisladas | Tenancy | 4 |
| RF-03 | Roles con permisos diferenciados | RBAC | 4 |
| RF-04 | Carga de documentos (PDF/DOCX/MD) | Ingestion | 2 |
| RF-05 | Procesamiento: chunking + embeddings | Ingestion | 2 |
| RF-06 | Indexación vectorial por empresa/rol | Retrieval | 3 |
| RF-07 | Chat conversacional | UI Chat | 5 |
| RF-08 | Recuperación semántica + rerank | RAG Core | 3 |
| RF-09 | Generación con LLM contextualizado | RAG Core | 3 |
| RF-10 | Citas inline + panel de fuentes | UI Citations | 5 |
| RF-11 | Rechazo sin contexto / fuera de alcance | Guardrails | 3 |
| RF-12 | Panel admin: empresas, docs, usuarios | Admin UI | 5 |
| RF-13 | Registro de consultas para evaluación | Analytics | 6 |
| RF-14 | Batería de 40 preguntas automatizable | Testing | 7 |
| RNF-01 | Aislamiento estricto tenant | Tenancy | 4 |
| RNF-02 | Trazabilidad de fuentes | RAG Core | 3 |
| RNF-03 | Ejecutable 100% en local | Infra | 0 |
| RNF-04 | UI según design system | UI | 0, 5 |
| RNF-05 | Latencia aceptable en prototipo | RAG Core | 3 |

---

## 3. Arquitectura

### 3.1 Vista de contenedores (local)

```mermaid
flowchart TB
  subgraph client [Cliente Web]
    UI[Next.js App Router]
  end

  subgraph app [Aplicación]
    API[Route Handlers / Server Actions]
    RAG[RAG Orchestrator]
    ING[Ingestion Pipeline]
  end

  subgraph data [Datos locales]
    PG[(PostgreSQL + pgvector)]
    FS[Filesystem /storage]
  end

  subgraph ai [IA local]
    OLL[Ollama LLM]
    EMB[Ollama Embeddings]
  end

  UI --> API
  API --> RAG
  API --> ING
  RAG --> PG
  RAG --> OLL
  ING --> EMB
  ING --> PG
  ING --> FS
```

### 3.2 Stack tecnológico (local-first)

| Capa | Tecnología | Motivo |
|------|------------|--------|
| Frontend | Next.js 16 + React 19 + Tailwind 4 | Ya iniciado en el repo |
| Backend | Next.js Route Handlers + Server Actions | Un solo repo, fácil despliegue |
| BD relacional | PostgreSQL 16 | Usuarios, empresas, metadatos |
| Vector store | pgvector | Sin servicio extra; filtra por tenant/rol |
| LLM local | Ollama (`llama3.2`, `mistral`) | Gratis, offline, académico |
| Embeddings | Ollama `nomic-embed-text` | Consistente con stack local |
| Auth | Auth.js (NextAuth v5) | Sesiones + roles en JWT/DB |
| Docs | `pdf-parse`, `mammoth`, `md` | PDF, DOCX, Markdown |
| ORM | Drizzle ORM | Tipado, migraciones simples |
| Validación | Zod | Schemas API |

### 3.3 Flujo RAG (consulta)

```mermaid
sequenceDiagram
  participant U as Usuario
  participant API as API /chat
  participant G as Guardrails
  participant R as Retriever
  participant L as LLM
  participant DB as pgvector

  U->>API: Pregunta + tenant + rol
  API->>G: Clasificar alcance
  alt Fuera de alcance
    G-->>U: Mensaje de rechazo estándar
  else En alcance
    API->>R: Query embedding
    R->>DB: Top-K chunks (tenant + rol)
    R->>R: Rerank / score threshold
    alt Sin chunks relevantes
      R-->>U: "No hay información en la documentación"
    else Con contexto
      R->>L: Prompt + chunks + instrucciones
      L-->>API: Respuesta + citas
      API-->>U: Stream + panel fuentes
    end
  end
```

### 3.4 Modelo de datos (resumen)

```
Tenant (empresa)
  ├── id, slug, name, sector, logo
  ├── Users (email, password_hash, role)
  ├── Documents (title, file_path, status, allowed_roles[])
  │     └── Chunks (content, embedding, metadata, section_ref)
  ├── Conversations
  │     └── Messages (role, content, citations[], latency_ms)
  └── AuditLogs
```

**Roles por empresa (propuesta v1)**

| Rol | Puede consultar | Puede administrar |
|-----|-----------------|-------------------|
| `empleado` | Políticas generales, código de conducta | No |
| `supervisor` | + procedimientos operativos | No |
| `rh` | + políticas de talento humano | Documentos RH |
| `admin_empresa` | Todo de su empresa | Usuarios y docs de su tenant |
| `super_admin` | Demo / evaluación | Todas las empresas (solo prototipo) |

### 3.5 Empresas simuladas (muestra)

| Empresa | Sector Cartagena | Documentos base |
|---------|------------------|-----------------|
| **Logística Caribe S.A.** | Logística / Zona Franca | Reglamento interno, política SST, manual bodega, política horarios |
| **Hotel Bahía Dorada** | Turismo / hospitalidad | Código de conducta, política huéspedes, procedimiento check-in, normas vestimenta |

Cada documento incluirá metadatos `allowed_roles[]` para probar RBAC.

---

## 4. Design system → implementación

Tokens en `docs/DESIGN.md`. Mapeo a Tailwind en `app/globals.css` (Fase 0).

| Componente DS | Ruta UI | Uso en el proyecto |
|---------------|---------|-------------------|
| 3-pane cockpit | `(app)/chat/layout.tsx` | Sidebar docs + chat + inspector fuentes |
| Citation chips `[1]` | `CitationChip.tsx` | Respuestas del asistente |
| Source drawer | `SourcePanel.tsx` | Fragmento, cosine sim, sección |
| Vectorization badges | `DocStatusBadge.tsx` | Admin: indexing/vectorized/error |
| KPI cards | `(admin)/dashboard` | % acierto, latencia, consultas |
| Query prompt engine | `ChatInput.tsx` | Scope selector + enviar |
| Dense CRUD tables | `(admin)/documents` | Gestión documental |

**Tipografías:** Plus Jakarta Sans (headings), Inter (body), JetBrains Mono (chunk IDs, latencias).

---

## 5. Fases de desarrollo (SDD)

Cada fase tiene **entregables**, **criterios de aceptación** y **cómo probar en local**.

---

### Fase 0 — Fundación e infraestructura local
**Duración estimada:** 2–3 días

**Entregables**
- [ ] `docker-compose.yml`: PostgreSQL + pgvector + Ollama
- [ ] `.env.example` y `.env.local`
- [ ] Tokens del design system en `globals.css`
- [ ] Estructura de carpetas (`src/` o `lib/`, `components/`, `db/`)
- [ ] Drizzle + migración inicial
- [ ] Script `pnpm dev:stack` (docker up + migrate + seed)

**Estructura de carpetas propuesta**
```
app/
  (auth)/login/
  (app)/chat/
  (admin)/dashboard/
  api/chat/route.ts
  api/documents/route.ts
components/
  ui/          # primitivos DS
  chat/
  admin/
lib/
  db/
  rag/
  ingestion/
  auth/
storage/documents/
docs/
  SDD.md
  REQUIREMENTS.md
  DESIGN.md
  test-questions/
scripts/
  seed.ts
  ingest.ts
  evaluate.ts
```

**Probar en local**
```bash
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
# → http://localhost:3000
```

**Criterio de aceptación:** Login page renderiza con colores DS; DB conecta; Ollama responde `curl http://localhost:11434/api/tags`.

---

### Fase 1 — Análisis y modelo de dominio
**Duración estimada:** 2 días

**Entregables**
- [ ] Schema Drizzle completo (tenants, users, documents, chunks, messages)
- [ ] Seed: 2 empresas + usuarios demo por rol
- [ ] Documentos simulados en `storage/seed/` (MD o DOCX)
- [ ] Matriz de requerimientos validada (`docs/REQUIREMENTS.md`)

**Usuarios demo (ejemplo)**
```
logistica-caribe / empleado@logistica.demo / demo123
logistica-caribe / rh@logistica.demo / demo123
hotel-bahia / empleado@hotel.demo / demo123
```

**Probar en local**
```bash
pnpm db:seed
pnpm db:studio   # ver tenants y usuarios
```

**Criterio de aceptación:** 2 tenants, ≥4 usuarios cada uno, roles distintos persistidos.

---

### Fase 2 — Ingestion pipeline (documentos → vectores)
**Duración estimada:** 4–5 días

**Entregables**
- [ ] Upload admin (PDF/DOCX/MD) → `storage/{tenantId}/`
- [ ] Parser + limpieza de texto
- [ ] Chunking: ~500 tokens, overlap 80, preservar `section_ref`
- [ ] Embeddings vía Ollama → insert en `chunks`
- [ ] Estados: `queued | indexing | vectorized | error`
- [ ] CLI `pnpm ingest --tenant logistica-caribe --file ./storage/seed/reglamento.md`

**Probar en local**
```bash
pnpm ingest --all
# Admin UI muestra badges "Vectorized" en verde
psql -c "SELECT count(*) FROM chunks WHERE tenant_id = '...';"
```

**Criterio de aceptación:** Cada documento seed produce chunks con embedding; re-index funciona; errores muestran badge rojo.

---

### Fase 3 — RAG Core (recuperación + generación + guardrails)
**Duración estimada:** 5–6 días

**Entregables**
- [ ] `lib/rag/retriever.ts`: embedding query + pgvector cosine + filtro tenant/rol
- [ ] `lib/rag/reranker.ts`: threshold mínimo (ej. 0.72); top 5 chunks
- [ ] `lib/rag/prompts.ts`: system prompt restrictivo (solo docs, citar fuentes, admitir desconocimiento)
- [ ] `lib/rag/guardrails.ts`: clasificador de alcance (keywords + LLM ligero)
- [ ] `lib/rag/generator.ts`: streaming SSE hacia cliente
- [ ] API `POST /api/chat`

**Prompt system (extracto)**
```
Eres un asistente corporativo de {empresa}. Responde ÚNICAMENTE usando el CONTEXTO.
Si la respuesta no está en el contexto, responde: "No encontré información sobre esto en la documentación disponible."
Cita cada afirmación con [n]. No inventes políticas ni interpretaciones legales.
```

**Probar en local**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Cuántos días de vacaciones tengo?","conversationId":"..."}'
# Verificar: chunks usados, score, respuesta citada
```

**Criterio de aceptación:** Pregunta con respuesta en docs → cita correcta; pregunta de clima → rechazo; pregunta sin info → mensaje estándar.

---

### Fase 4 — Multi-tenant y RBAC
**Duración estimada:** 3 días

**Entregables**
- [ ] Auth.js con credenciales + sesión (`tenantId`, `role`)
- [ ] Middleware: inyectar tenant en todas las queries
- [ ] Row-level: chunks/documents filtrados por `tenant_id` AND `allowed_roles`
- [ ] Tests: usuario empresa A no ve chunks empresa B
- [ ] Empleado no recupera chunks marcados `rh-only`

**Probar en local**
1. Login empleado Logística → preguntar política RH exclusiva → "No encontré información..."
2. Login RH Logística → misma pregunta → respuesta con fuente
3. Login Hotel → preguntar política Logística → sin resultados

**Criterio de aceptación:** Cero fugas cross-tenant en pruebas manuales y script `pnpm test:tenant-isolation`.

---

### Fase 5 — UI (design system completo)
**Duración estimada:** 5–7 días

**Entregables**
- [ ] Layout 3 paneles (sidebar | chat | inspector)
- [ ] Pantalla login (institucional DS)
- [ ] Chat con streaming, citation chips, source drawer
- [ ] Admin: dashboard KPI, tabla documentos, upload, usuarios
- [ ] Responsive: drawers en mobile

**Pantallas**
| Ruta | Rol | Función |
|------|-----|---------|
| `/login` | Público | Autenticación |
| `/chat` | Todos autenticados | Consulta principal |
| `/admin` | admin_empresa, super_admin | Gestión |
| `/admin/documents` | admin | CRUD + reindex |
| `/admin/evaluation` | super_admin | Correr 40 preguntas |

**Probar en local:** Flujo completo UI sin curl; inspector muestra fragmento resaltado.

**Criterio de aceptación:** UI coincide con tokens DS; citas clicables abren panel; badges de estado correctos.

---

### Fase 6 — Integración y observabilidad
**Duración estimada:** 2–3 días

**Entregables**
- [ ] Persistencia de conversaciones y mensajes
- [ ] Log por consulta: pregunta, chunks, scores, latencia, modelo
- [ ] Export JSON/CSV de resultados (para tesis)
- [ ] Manejo de errores Ollama/DB con UI amigable

**Probar en local**
```bash
pnpm evaluate --export ./docs/results/run-001.json
```

**Criterio de aceptación:** Cada mensaje guarda trazabilidad completa para análisis cualitativo.

---

### Fase 7 — Pruebas (40 preguntas)
**Duración estimada:** 3–4 días

**Entregables**
- [ ] `docs/test-questions/questions.json` (40 ítems categorizados)
- [ ] Script `pnpm evaluate` con métricas automáticas
- [ ] Informe: % correctas, sin fundamento, rechazadas, latencia

**Categorías de preguntas (distribución sugerida)**
| Categoría | Cantidad | Ejemplo |
|-----------|----------|---------|
| Respuesta directa en doc | 15 | "¿Cuál es el horario de entrada?" |
| Requiere relacionar 2 secciones | 10 | "¿Puedo teletrabajar los viernes?" |
| Info no disponible | 8 | "¿Hay bono de navidad?" |
| Fuera de alcance | 7 | "¿Quién ganó el mundial?" |

**Probar en local**
```bash
pnpm evaluate --tenant logistica-caribe --user rh@logistica.demo
# Genera docs/results/evaluation-report.md
```

**Criterio de aceptación:** Reporte con tablas/gráficos listos para capítulo de resultados.

---

### Fase 8 — Ajustes finales
**Duración estimada:** 3–5 días (iterativo)

**Actividades**
- Ajustar chunk size / overlap según fallos
- Refinar prompts y threshold de similitud
- Mejorar clasificador fuera-de-alcance
- Documentar limitaciones para discusión académica

**Criterio de aceptación:** Métricas Fase 7 cumplen objetivos o quedan explicadas con evidencia.

---

## 6. Configuración local (referencia rápida)

### 6.1 Variables de entorno
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chatbot_rag
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
AUTH_SECRET=generar-con-openssl-rand-base64-32
STORAGE_PATH=./storage
RAG_TOP_K=5
RAG_MIN_SCORE=0.72
```

### 6.2 Servicios Docker
```yaml
# docker-compose.yml (resumen)
services:
  db:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]
  ollama:
    image: ollama/ollama
    ports: ["11434:11434"]
    volumes: [ollama_data:/root/.ollama]
```

### 6.3 Post-instalación Ollama
```bash
docker exec -it ollama ollama pull llama3.2
docker exec -it ollama ollama pull nomic-embed-text
```

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Alucinaciones del LLM | RAG estricto + prompt + threshold + "no sé" |
| LLM local lento | Modelo pequeño (3B/7B); streaming UI |
| Chunks irrelevantes | Rerank + metadata por sección |
| Fuga entre tenants | Middleware + tests + FK tenant_id |
| RBAC incompleto | `allowed_roles` en chunks + tests por rol |

---

## 8. Próximo paso inmediato

Ejecutar **Fase 0** en este repositorio:
1. Copiar `DESIGN.md` → `docs/DESIGN.md`
2. Agregar `docker-compose.yml`, `.env.example`, tokens CSS
3. Instalar Drizzle + Auth.js + dependencias RAG
4. Crear migración y seed mínimo

Cuando confirmes, se puede implementar Fase 0 completa en el código.
