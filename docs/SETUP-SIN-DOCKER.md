# Configuración sin Docker

Puedes ejecutar el proyecto **sin Docker** instalando PostgreSQL y Ollama de forma nativa en Windows, o usando una base de datos gratuita en la nube.

---

## Resumen rápido

| Componente | Sin Docker | Puerto |
|------------|------------|--------|
| Base de datos | PostgreSQL nativo **o** Neon (nube gratis) | 5432 |
| LLM + embeddings | Ollama para Windows | 11434 |
| App Next.js | `pnpm dev` | 3000 |

**Para Fase 0–1 (login + documentos):** solo necesitas PostgreSQL.  
**Para Fase 2–3 (RAG):** también Ollama.

---

## Opción 1 — Todo local (PostgreSQL + Ollama nativos)

### Paso 1: Instalar PostgreSQL

PowerShell (normal o admin):

```powershell
winget install PostgreSQL.PostgreSQL.17 --accept-package-agreements --accept-source-agreements
```

Durante la instalación:
- Anota la **contraseña del usuario `postgres`**
- Puerto por defecto: **5432**

Crea la base de datos (desde **SQL Shell (psql)** o pgAdmin):

```sql
CREATE DATABASE chatbot_rag;
```

### Paso 2: Instalar Ollama (para RAG, opcional por ahora)

```powershell
winget install Ollama.Ollama --accept-package-agreements --accept-source-agreements
```

Abre una terminal nueva y descarga los modelos:

```powershell
ollama pull llama3.2
ollama pull nomic-embed-text
```

Verifica:

```powershell
ollama list
curl http://localhost:11434/api/tags
```

### Paso 3: Configurar `.env.local`

Copia y edita con **tu contraseña de postgres**:

```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/chatbot_rag

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text

AUTH_SECRET=un-secreto-largo-aleatorio-minimo-32-chars
STORAGE_PATH=./storage
NEXT_PUBLIC_APP_NAME=Chatbot Corporativo RAG
```

Generar `AUTH_SECRET` en PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Paso 4: Inicializar y arrancar

```powershell
cd "C:\Users\DAMIAN ZSIROS\Documents\projects\chatbot-corporativo-multitenant-rag-ia"
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Opción 2 — PostgreSQL en la nube (cero instalación de BD)

Si no quieres instalar PostgreSQL en tu PC:

1. Crea cuenta gratis en [Neon](https://neon.tech) o [Supabase](https://supabase.com)
2. Crea un proyecto y copia la **connection string** PostgreSQL
3. Pégala en `.env.local`:

```env
DATABASE_URL=postgresql://usuario:password@ep-xxx.region.aws.neon.tech/chatbot_rag?sslmode=require
```

4. Ejecuta:

```powershell
pnpm db:push
pnpm db:seed
pnpm dev
```

5. Instala solo **Ollama nativo** (Opción 1, paso 2) cuando llegues a la Fase RAG.

> Neon/Supabase no requieren Docker ni PostgreSQL local. Solo conexión a internet.

---

## Opción 3 — Script automático (sin Docker)

PowerShell en la carpeta del proyecto:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\scripts\setup-local-sin-docker.ps1
```

El script instala Ollama y PostgreSQL vía winget si no están presentes, y te guía para crear la BD.

---

## Verificación

```powershell
# PostgreSQL responde
psql -U postgres -h localhost -c "\l"

# Ollama responde (cuando lo uses)
curl http://localhost:11434/api/tags

# App
pnpm dev
```

Login demo: `empleado@logistica.demo` / contraseña `demo123`

---

## pgvector (Fase 2 — ingestion)

Cuando implementemos embeddings con pgvector en PostgreSQL **local**, habrá que instalar la extensión:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

En **Neon**, pgvector suele estar disponible desde el panel SQL con el mismo comando.

---

## Comparación

| | Docker | Sin Docker |
|---|--------|------------|
| Instalación | Docker Desktop + WSL | PostgreSQL + Ollama nativos |
| RAM | ~4 GB contenedores | Similar, servicios Windows |
| Complejidad | Un `docker compose up` | Dos instaladores winget |
| Portabilidad | Igual en Mac/Linux | Windows específico |
| Recomendado si | Ya usas Docker | No quieres WSL/Docker |

---

## Problemas frecuentes

| Error | Solución |
|-------|----------|
| `DATABASE_URL is not set` | Crea `.env.local` desde `.env.example` |
| `connection refused :5432` | Inicia el servicio PostgreSQL en *Servicios de Windows* |
| `password authentication failed` | Revisa usuario/contraseña en `DATABASE_URL` |
| `ollama` no reconocido | Reinicia terminal tras instalar Ollama |
| `pnpm db:push` falla | Verifica que la BD `chatbot_rag` exista |
