#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Instala WSL2 y Docker Desktop en Windows para el proyecto chatbot RAG.

.EJECUCION
  Clic derecho en PowerShell -> "Ejecutar como administrador", luego:
  Set-Location "C:\Users\DAMIAN ZSIROS\Documents\projects\chatbot-corporativo-multitenant-rag-ia"
  .\scripts\install-docker-windows.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host "=== Instalacion WSL2 + Docker Desktop ===" -ForegroundColor Cyan

function Test-Admin {
  $current = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($current)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
  Write-Host "Este script debe ejecutarse como Administrador." -ForegroundColor Red
  Write-Host "Abre PowerShell como admin y vuelve a ejecutarlo." -ForegroundColor Yellow
  exit 1
}

Write-Host "`n[1/4] Habilitando componentes de Windows (WSL + Virtual Machine Platform)..." -ForegroundColor Green
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart | Out-Null
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart | Out-Null

Write-Host "`n[2/4] Instalando WSL2..." -ForegroundColor Green
wsl --install --no-distribution

Write-Host "`n[3/4] Instalando Docker Desktop via winget..." -ForegroundColor Green
winget install Docker.DockerDesktop `
  --accept-package-agreements `
  --accept-source-agreements `
  --disable-interactivity

Write-Host "`n[4/4] Verificacion..." -ForegroundColor Green
Write-Host "WSL:" (wsl --version 2>$null)
Write-Host "Docker:" (Get-Command docker -ErrorAction SilentlyContinue)

Write-Host @"

=== IMPORTANTE ===
1. REINICIA el equipo (requerido tras instalar WSL).
2. Tras reiniciar, abre "Docker Desktop" desde el menu Inicio y espera a que diga "Engine running".
3. En la carpeta del proyecto ejecuta:
   pnpm dev:stack
   pnpm db:push
   pnpm db:seed
   pnpm dev

Si Docker pide activar WSL2 integration, acepta en Settings > General > Use WSL 2 based engine.

"@ -ForegroundColor Cyan
