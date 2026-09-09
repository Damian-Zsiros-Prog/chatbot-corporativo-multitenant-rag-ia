# Instalar Docker en Windows (local)

Docker Desktop en Windows **requiere WSL 2**. Sigue estos pasos en orden.

---

## Opción A — Script automático (recomendado)

1. Abre **PowerShell como Administrador**  
   (Inicio → escribe `PowerShell` → clic derecho → *Ejecutar como administrador*)

2. Ejecuta:

```powershell
Set-Location "C:\Users\DAMIAN ZSIROS\Documents\projects\chatbot-corporativo-multitenant-rag-ia"
Set-ExecutionPolicy -Scope Process Bypass -Force
.\scripts\install-docker-windows.ps1
```

3. **Reinicia el PC** cuando termine.

4. Abre **Docker Desktop** desde el menú Inicio y espera *Engine running*.

---

## Opción B — Manual paso a paso

### Paso 1: Instalar WSL 2

PowerShell **como Administrador**:

```powershell
wsl --install --no-distribution
```

Si el comando no funciona, habilita las características:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
wsl --install --no-distribution
```

**Reinicia el equipo.**

Tras reiniciar, verifica:

```powershell
wsl --version
```

Debe mostrar WSL versión 2.x.

### Paso 2: Instalar Docker Desktop

PowerShell (admin o normal):

```powershell
winget install Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
```

O descarga el instalador: [https://docs.docker.com/desktop/setup/install/windows-install/](https://docs.docker.com/desktop/setup/install/windows-install/)

### Paso 3: Configurar Docker Desktop

1. Abre **Docker Desktop**.
2. Acepta los términos si aparecen.
3. En **Settings → General**:
   - ✅ *Use the WSL 2 based engine*
4. En **Settings → Resources → WSL Integration**:
   - ✅ Activa integración con tu distro (si instalaste Ubuntu, actívala).

Espera hasta que el icono de Docker muestre **Engine running**.

### Paso 4: Verificar

```powershell
docker --version
docker compose version
docker run hello-world
```

---

## Levantar el proyecto

Desde la carpeta del proyecto:

```powershell
pnpm dev:stack
docker ps
pnpm db:push
pnpm db:seed
pnpm dev
```

### Modelos Ollama (primera vez)

```powershell
docker exec -it chatbot-rag-ollama ollama pull llama3.2
docker exec -it chatbot-rag-ollama ollama pull nomic-embed-text
```

---

## Problemas frecuentes

| Problema | Solución |
|----------|----------|
| `docker` no reconocido | Reinicia PC; abre Docker Desktop; cierra y abre la terminal |
| WSL no instalado | Ejecuta `wsl --install` como admin y reinicia |
| Virtualización deshabilitada | En BIOS/UEFI activa **Intel VT-x** o **AMD-V** |
| Docker no arranca | Settings → Troubleshoot → *Restart Docker* |
| Puerto 5432 ocupado | Detén otro PostgreSQL local o cambia el puerto en `docker-compose.yml` |

---

## Requisitos del sistema

- Windows 10/11 64-bit (build 19041+)
- Virtualización habilitada en BIOS
- ~4 GB RAM libres para contenedores (PostgreSQL + Ollama)
- Espacio en disco: ~8 GB (Docker + modelos Ollama)
