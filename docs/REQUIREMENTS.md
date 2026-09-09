# Matriz de Requerimientos

Derivada del documento de grado y alineada al SDD (`docs/SDD.md`).

---

## Requerimientos funcionales (RF)

| ID | Descripción | Prioridad | Rol(es) | Criterio de aceptación |
|----|-------------|-----------|---------|------------------------|
| RF-01 | El sistema debe permitir autenticación con email y contraseña | Alta | Todos | Usuario válido accede; inválido recibe error |
| RF-02 | El sistema debe soportar 2 empresas simuladas independientes | Alta | Super admin | Datos de empresa A no visibles en empresa B |
| RF-03 | Cada usuario pertenece a una empresa y tiene un rol | Alta | Todos | Sesión incluye `tenantId` y `role` |
| RF-04 | El administrador puede cargar documentos (PDF, DOCX, MD) | Alta | admin_empresa | Archivo guardado y registrado en BD |
| RF-05 | Los documentos se procesan en fragmentos (chunks) indexables | Alta | Sistema | Cada doc genera ≥1 chunk con metadata |
| RF-06 | Cada chunk se vectoriza y almacena en BD vectorial | Alta | Sistema | Embedding presente; estado `vectorized` |
| RF-07 | El usuario puede enviar preguntas en lenguaje natural | Alta | empleado, supervisor, rh | Mensaje aparece en chat y recibe respuesta |
| RF-08 | El sistema recupera fragmentos relevantes antes de responder | Alta | Sistema | Top-K chunks con score de similitud |
| RF-09 | La recuperación filtra por empresa del usuario | Alta | Sistema | Solo chunks del tenant activo |
| RF-10 | La recuperación filtra por rol (documentos restringidos) | Alta | Sistema | Empleado no accede chunks RH-only |
| RF-11 | El LLM genera respuesta usando solo contexto recuperado | Alta | Sistema | Prompt incluye chunks; instrucción anti-alucinación |
| RF-12 | Cada respuesta incluye citas a fuentes documentales | Alta | Todos | ≥1 cita cuando hay respuesta fundamentada |
| RF-13 | El usuario puede ver fragmento original, documento y sección | Alta | Todos | Panel inspector con texto y metadata |
| RF-14 | Si no hay información, el sistema lo indica explícitamente | Alta | Todos | Mensaje estándar sin inventar |
| RF-15 | Preguntas fuera de reglamentos/políticas son rechazadas | Alta | Todos | Respuesta de alcance limitado |
| RF-16 | El admin gestiona usuarios de su empresa | Media | admin_empresa | CRUD usuarios dentro del tenant |
| RF-17 | El admin puede re-indexar o eliminar documentos | Media | admin_empresa | Reindex actualiza chunks; delete limpia vectores |
| RF-18 | Las conversaciones se persisten | Media | Todos | Historial visible en sesión |
| RF-19 | El sistema registra métricas por consulta (latencia, fuentes) | Media | admin, evaluación | Log exportable |
| RF-20 | Script de evaluación con 40 preguntas predefinidas | Alta | super_admin | Reporte automático de resultados |

---

## Requerimientos no funcionales (RNF)

| ID | Descripción | Prioridad | Métrica / verificación |
|----|-------------|-----------|------------------------|
| RNF-01 | Aislamiento multi-tenant | Alta | 0 fugas en tests automatizados |
| RNF-02 | Trazabilidad y auditabilidad | Alta | 100% respuestas con traza de chunks |
| RNF-03 | Ejecución local sin APIs de pago | Alta | Ollama + Docker; sin OPENAI_KEY obligatoria |
| RNF-04 | Interfaz según design system Enterprise RAG Intelligence | Alta | Revisión visual contra `docs/DESIGN.md` |
| RNF-05 | Tiempo de respuesta aceptable en prototipo | Media | p95 < 15s local |
| RNF-06 | Seguridad básica: contraseñas hasheadas, sesiones seguras | Alta | bcrypt/argon2 + AUTH_SECRET |
| RNF-07 | Escalabilidad documental mínima | Baja | ≥20 documentos por empresa sin degradación crítica |
| RNF-08 | Mantenibilidad: código modular por capas | Media | Separación ingestion / rag / ui |
| RNF-09 | Accesibilidad básica | Baja | Contraste DS, targets ≥44px mobile |
| RNF-10 | Idioma de interfaz y respuestas: español | Alta | UI y prompts en español |

---

## Restricciones del dominio (documento de grado)

| Restricción | Implicación técnica |
|-------------|---------------------|
| Solo reglamentos y políticas | Guardrail de clasificación + prompt restrictivo |
| No reemplazar lectura oficial | Disclaimer en UI + citas obligatorias |
| 2 empresas simuladas | Seed data Cartagena (logística + turismo) |
| 40 preguntas de prueba | Dataset en `docs/test-questions/` |
| Sin datos confidenciales reales | Documentos ficticios creados por el equipo |
| Respuestas contextualizadas por rol | RBAC en retrieval |

---

## Trazabilidad objetivos específicos → requerimientos

| Objetivo específico (tesis) | Requerimientos relacionados |
|-----------------------------|----------------------------|
| Identificar RF y RNF | Este documento + RF-01 a RF-20, RNF-01 a RNF-10 |
| Diseñar arquitectura RAG multi-tenant | RF-02, RF-08–RF-11, RNF-01, SDD §3 |
| Verificar con pruebas documentales | RF-14, RF-15, RF-20, Fase 7 SDD |

---

## Checklist funcional por módulo (lista de verificación)

### Auth & Tenancy
- [ ] Login / logout
- [ ] Sesión con tenant + rol
- [ ] Middleware protege rutas

### Ingestion
- [ ] Upload multi-formato
- [ ] Chunking configurable
- [ ] Embeddings + estados visuales

### RAG
- [ ] Retrieval con filtros
- [ ] Generación streaming
- [ ] Guardrails alcance
- [ ] Respuesta sin fundamento controlada

### UI
- [ ] Chat 3-pane
- [ ] Citation chips + source drawer
- [ ] Admin dashboard + CRUD docs

### Evaluación
- [ ] 40 preguntas ejecutables
- [ ] Export resultados (JSON/MD)
