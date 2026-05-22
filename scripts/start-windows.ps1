$ErrorActionPreference = "Stop"
Set-Location -Path (Split-Path -Path $PSScriptRoot -Parent)
docker compose up -d --build
Write-Host "Prelegal is running at http://localhost:8000"
