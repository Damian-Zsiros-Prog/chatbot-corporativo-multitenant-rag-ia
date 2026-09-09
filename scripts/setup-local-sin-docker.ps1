# Instalacion nativa sin Docker (Windows)
# Ejecutar desde la carpeta del proyecto:
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   .\scripts\setup-local-sin-docker.ps1

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "`n=== Setup local SIN Docker ===" -ForegroundColor Cyan
Write-Host "Proyecto: $ProjectRoot`n"

function Test-Command($name) {
  return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

# --- PostgreSQL ---
Write-Host "[1/4] PostgreSQL..." -ForegroundColor Green
if (Test-Command psql) {
  Write-Host "  psql encontrado." -ForegroundColor Gray
} else {
  Write-Host "  PostgreSQL no detectado. Instalando via winget..." -ForegroundColor Yellow
  Write-Host "  IMPORTANTE: Durante la instalacion anota la contraseña del usuario postgres." -ForegroundColor Yellow
  winget install PostgreSQL.PostgreSQL.17 `
    --accept-package-agreements `
    --accept-source-agreements `
    --disable-interactivity
  Write-Host "  Reinicia la terminal despues de instalar PostgreSQL." -ForegroundColor Yellow
}

# --- Ollama ---
Write-Host "`n[2/4] Ollama (IA local, para fases RAG)..." -ForegroundColor Green
if (Test-Command ollama) {
  Write-Host "  ollama encontrado." -ForegroundColor Gray
} else {
  Write-Host "  Ollama no detectado. Instalando via winget..." -ForegroundColor Yellow
  winget install Ollama.Ollama `
    --accept-package-agreements `
    --accept-source-agreements `
    --disable-interactivity
  Write-Host "  Reinicia la terminal y ejecuta: ollama pull llama3.2" -ForegroundColor Yellow
}

# --- .env.local ---
Write-Host "`n[3/4] Archivo .env.local..." -ForegroundColor Green
$envFile = Join-Path $ProjectRoot ".env.local"
$envExample = Join-Path $ProjectRoot ".env.example"

if (-not (Test-Path $envFile)) {
  Copy-Item $envExample $envFile
  Write-Host "  Creado .env.local desde .env.example" -ForegroundColor Gray
} else {
  Write-Host "  .env.local ya existe." -ForegroundColor Gray
}

Write-Host "  Edita .env.local y cambia TU_PASSWORD en DATABASE_URL:" -ForegroundColor Yellow
Write-Host '  DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/chatbot_rag' -ForegroundColor White

# --- Base de datos ---
Write-Host "`n[4/4] Crear base de datos chatbot_rag..." -ForegroundColor Green
Write-Host @"
  Si psql esta disponible, ejecuta manualmente:

    psql -U postgres -h localhost -c "CREATE DATABASE chatbot_rag;"

  Luego en la carpeta del proyecto:

    pnpm install
    pnpm db:push
    pnpm db:seed
    pnpm dev

  Login demo: empleado@logistica.demo / demo123

  Guia completa: docs/SETUP-SIN-DOCKER.md

"@ -ForegroundColor Cyan
