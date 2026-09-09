# Limitaciones conocidas (v1)

Documento de apoyo para la discusión académica del prototipo.

## Alcance funcional

- Solo responde sobre reglamentos, políticas y procedimientos indexados por empresa.
- No sustituye asesoría legal ni la lectura oficial del documento fuente.
- El clasificador de fuera-de-alcance usa reglas heurísticas; puede confundir tareas generales (traducción, código) con consultas corporativas si la redacción es ambigua.

## RAG y recuperación

- Embeddings locales (`nomic-embed-text`) con similitud coseno; sin reranker dedicado.
- Umbral mínimo configurable (`RAG_MIN_SCORE`); valores altos reducen alucinaciones pero aumentan falsos “sin información”.
- Chunking por secciones Markdown (~500 tokens); documentos muy densos pueden fragmentar contexto relacionado.

## Modelo generativo

- `llama3.2` (3B) en CPU; calidad y latencia inferiores a modelos cloud de mayor tamaño.
- Latencia p95 puede superar 15 s en hardware modesto; el droplet remoto mejora tiempos pero no elimina la variabilidad.

## Multi-tenant y RBAC

- Aislamiento por `tenant_id` y roles en metadatos de chunks; no hay cifrado por tenant ni auditoría legal.
- Roles simulados en demo (`empleado`, `supervisor`, `rh`, `admin_empresa`).

## Evaluación

- Batería fija de 40 preguntas; métricas automáticas con keywords y tipo de respuesta esperado.
- Objetivo v1: ≥ 80% aciertos, ≥ 90% rechazo fuera-de-alcance (ver `docs/SDD.md`).
